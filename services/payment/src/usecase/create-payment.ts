import { createHash } from "node:crypto";
import type { IOrderService } from "../interface/order-service.js";
import type { IPaymentProvider } from "../interface/payment-provider.js";
import type { IPaymentRepository } from "../interface/payment-repository.js";
import type { CreatePaymentInput } from "../model/payment.dto.js";
import { toPublicPayment, type PublicPayment } from "../model/payment.js";
import {
  ForbiddenError,
  IdempotencyConflictError,
  OrderNotPayableError,
  PaymentAlreadyExistsError,
} from "../model/errors.js";
import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";
import { normalizeMoney } from "../shared/money.js";
import type { OrderPaymentSynchronizer } from "./order-payment-synchronizer.js";

export interface CreatePaymentResult {
  payment: PublicPayment;
  replayed: boolean;
  inFlight: boolean;
}

const hashIntent = (customerId: string, input: CreatePaymentInput): string =>
  createHash("sha256")
    .update(`${customerId}\0${input.orderId}\0${input.method}`)
    .digest("hex");

export class CreatePaymentCommandHandler {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly orders: IOrderService,
    private readonly provider: IPaymentProvider,
    private readonly synchronizer: OrderPaymentSynchronizer,
  ) {}

  async execute(command: {
    customerId: string;
    idempotencyKey: string;
    input: CreatePaymentInput;
  }): Promise<CreatePaymentResult> {
    const requestHash = hashIntent(command.customerId, command.input);
    const prior = await this.payments.findByIdempotencyKey(
      command.customerId,
      command.idempotencyKey,
    );
    if (prior) return this.replay(prior, requestHash);

    const order = await this.orders.getPaymentContext(command.input.orderId);
    if (order.customerUserId !== command.customerId) {
      throw new ForbiddenError("Order does not belong to this customer");
    }
    if (order.status !== OrderStatus.PENDING) throw new OrderNotPayableError();
    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new OrderNotPayableError("Order is already paid");
    }
    if (order.paymentMethod && order.paymentMethod !== command.input.method) {
      throw new OrderNotPayableError(
        "Order is already associated with a different payment method",
      );
    }

    const amount = normalizeMoney(order.totalPrice);
    if (amount === "0.00") throw new OrderNotPayableError("Order total must be positive");

    const claimed = await this.payments.claim({
      orderId: order.id,
      customerId: command.customerId,
      amount,
      method: command.input.method,
      status:
        command.input.method === PaymentMethod.COD
          ? PaymentStatus.PENDING
          : PaymentStatus.PROCESSING,
      idempotencyKey: command.idempotencyKey,
      requestHash,
    });
    if (claimed.kind === "ORDER_CONFLICT") throw new PaymentAlreadyExistsError();
    if (claimed.kind === "EXISTING") {
      return this.replay(claimed.payment, requestHash);
    }

    let payment = claimed.payment;
    if (payment.method === PaymentMethod.MOCK_ONLINE) {
      const outcome = await this.provider.charge({
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
      });
      payment = outcome.succeeded
        ? await this.payments.markSucceeded(
            payment.id,
            outcome.providerTransactionId,
          )
        : await this.payments.markFailed(payment.id, outcome.failureCode);
    }

    payment = await this.synchronizer.attempt(payment);
    return { payment: toPublicPayment(payment), replayed: false, inFlight: false };
  }

  private replay(
    payment: Parameters<typeof toPublicPayment>[0],
    requestHash: string,
  ): CreatePaymentResult {
    if (payment.requestHash !== requestHash) throw new IdempotencyConflictError();
    return {
      payment: toPublicPayment(payment),
      replayed: true,
      inFlight: payment.status === PaymentStatus.PROCESSING,
    };
  }
}
