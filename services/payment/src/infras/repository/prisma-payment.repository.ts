import type {
  Payment as PrismaPayment,
  PrismaClient,
} from "../../generated/prisma/client.js";
import type {
  ClaimPaymentData,
  ClaimPaymentResult,
  IPaymentRepository,
} from "../../interface/payment-repository.js";
import type { Payment } from "../../model/payment.js";
import {
  OrderSyncStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../share/enums/index.js";

const toDomain = (payment: PrismaPayment): Payment => ({
  id: payment.id,
  orderId: payment.orderId,
  customerId: payment.customerId,
  amount: payment.amount.toString(),
  method: PaymentMethod[payment.method],
  status: PaymentStatus[payment.status],
  providerTransactionId: payment.providerTransactionId,
  failureCode: payment.failureCode,
  idempotencyKey: payment.idempotencyKey,
  requestHash: payment.requestHash,
  orderSyncStatus: OrderSyncStatus[payment.orderSyncStatus],
  orderSyncAttempts: payment.orderSyncAttempts,
  nextOrderSyncAt: payment.nextOrderSyncAt,
  orderSyncedAt: payment.orderSyncedAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2002";

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly database: PrismaClient) {}

  async findByIdempotencyKey(customerId: string, idempotencyKey: string) {
    const payment = await this.database.payment.findUnique({
      where: { customerId_idempotencyKey: { customerId, idempotencyKey } },
    });
    return payment ? toDomain(payment) : null;
  }

  async claim(data: ClaimPaymentData): Promise<ClaimPaymentResult> {
    try {
      const payment = await this.database.payment.create({
        data: {
          ...data,
          orderSyncStatus:
            data.status === PaymentStatus.PENDING
              ? OrderSyncStatus.PENDING
              : OrderSyncStatus.NOT_REQUIRED,
          nextOrderSyncAt:
            data.status === PaymentStatus.PENDING ? new Date() : null,
        },
      });
      return { kind: "CLAIMED", payment: toDomain(payment) };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const existing = await this.findByIdempotencyKey(
        data.customerId,
        data.idempotencyKey,
      );
      if (existing) return { kind: "EXISTING", payment: existing };

      const active = await this.database.payment.findFirst({
        where: {
          orderId: data.orderId,
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.PROCESSING,
              PaymentStatus.SUCCEEDED,
            ],
          },
        },
      });
      if (active) return { kind: "ORDER_CONFLICT" };

      // The conflicting attempt may have become FAILED between the unique
      // violation and the lookup. One bounded retry safely closes that race.
      try {
        const payment = await this.database.payment.create({
          data: {
            ...data,
            orderSyncStatus:
              data.status === PaymentStatus.PENDING
                ? OrderSyncStatus.PENDING
                : OrderSyncStatus.NOT_REQUIRED,
            nextOrderSyncAt:
              data.status === PaymentStatus.PENDING ? new Date() : null,
          },
        });
        return { kind: "CLAIMED", payment: toDomain(payment) };
      } catch (retryError) {
        if (isUniqueViolation(retryError)) return { kind: "ORDER_CONFLICT" };
        throw retryError;
      }
    }
  }

  async findByIdForCustomer(id: string, customerId: string) {
    const payment = await this.database.payment.findFirst({
      where: { id, customerId },
    });
    return payment ? toDomain(payment) : null;
  }

  async markSucceeded(id: string, providerTransactionId: string) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          providerTransactionId,
          failureCode: null,
          orderSyncStatus: OrderSyncStatus.PENDING,
          nextOrderSyncAt: new Date(),
        },
      }),
    );
  }

  async markFailed(id: string, failureCode: string) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.FAILED,
          failureCode,
          orderSyncStatus: OrderSyncStatus.NOT_REQUIRED,
          nextOrderSyncAt: null,
        },
      }),
    );
  }

  async markOrderSynced(id: string) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          orderSyncStatus: OrderSyncStatus.SYNCED,
          orderSyncedAt: new Date(),
          nextOrderSyncAt: null,
        },
      }),
    );
  }

  async recordOrderSyncFailure(id: string, nextAttemptAt: Date) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          orderSyncStatus: OrderSyncStatus.PENDING,
          orderSyncAttempts: { increment: 1 },
          nextOrderSyncAt: nextAttemptAt,
        },
      }),
    );
  }

  async findDueOrderSync(now: Date, limit: number) {
    const payments = await this.database.payment.findMany({
      where: {
        orderSyncStatus: OrderSyncStatus.PENDING,
        nextOrderSyncAt: { lte: now },
      },
      orderBy: { nextOrderSyncAt: "asc" },
      take: limit,
    });
    return payments.map(toDomain);
  }
}
