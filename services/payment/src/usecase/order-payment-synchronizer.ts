import type { IOrderService } from "../interface/order-service.js";
import type { IPaymentRepository } from "../interface/payment-repository.js";
import type { Payment } from "../model/payment.js";
import {
  OrderPaymentStatus,
  OrderStatus,
  OrderSyncStatus,
  PaymentStatus,
} from "../share/enums/index.js";

export class OrderPaymentSynchronizer {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly orders: IOrderService,
    private readonly retryBaseMs = 1_000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async attempt(payment: Payment): Promise<Payment> {
    if (payment.orderSyncStatus !== OrderSyncStatus.PENDING) return payment;

    const orderPaymentStatus =
      payment.status === PaymentStatus.SUCCEEDED
        ? OrderPaymentStatus.PAID
        : payment.status === PaymentStatus.PENDING
          ? OrderPaymentStatus.UNPAID
          : null;
    if (!orderPaymentStatus) return payment;

    try {
      const result = await this.orders.syncPayment(
        payment.orderId,
        payment.method,
        orderPaymentStatus,
      );
      const refundRequired =
        payment.status === PaymentStatus.SUCCEEDED &&
        result.orderStatus === OrderStatus.CANCELLED;
      return await this.payments.markOrderSynced(payment.id, refundRequired);
    } catch {
      const exponent = Math.min(payment.orderSyncAttempts, 8);
      const nextAttemptAt = new Date(
        this.now().getTime() + this.retryBaseMs * 2 ** exponent,
      );
      return this.payments.recordOrderSyncFailure(payment.id, nextAttemptAt);
    }
  }

  async reconcile(limit = 50): Promise<number> {
    const due = await this.payments.findDueOrderSync(this.now(), limit);
    await Promise.all(due.map((payment) => this.attempt(payment)));
    return due.length;
  }
}
