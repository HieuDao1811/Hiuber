import type {
  Payment as PrismaPayment,
  PrismaClient,
} from "../../generated/prisma/client.js";
import type {
  ClaimPaymentData,
  ClaimPaymentResult,
  IPaymentRepository,
  ProviderEventData,
} from "../../interface/payment-repository.js";
import { InvalidProviderEventError } from "../../model/errors.js";
import type { Payment } from "../../model/payment.js";
import {
  OrderSyncStatus,
  PaymentMethod,
  PaymentResolutionStatus,
  PaymentStatus,
} from "../../share/enums/index.js";
import { normalizeMoney } from "../../shared/money.js";

const toDomain = (payment: PrismaPayment): Payment => ({
  id: payment.id,
  orderId: payment.orderId,
  customerId: payment.customerId,
  amount: normalizeMoney(payment.amount.toString()),
  currency: payment.currency,
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
  resolutionStatus: PaymentResolutionStatus[payment.resolutionStatus],
  resolutionReason: payment.resolutionReason,
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

  async markProcessing(id: string, providerTransactionId: string) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: { providerTransactionId },
      }),
    );
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

  async markFailed(
    id: string,
    providerTransactionId: string,
    failureCode: string,
  ) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.FAILED,
          providerTransactionId,
          failureCode,
          orderSyncStatus: OrderSyncStatus.NOT_REQUIRED,
          nextOrderSyncAt: null,
        },
      }),
    );
  }

  async applyProviderEvent(event: ProviderEventData) {
    try {
      return await this.database.$transaction(async (transaction) => {
        const current = await transaction.payment.findUnique({
          where: { id: event.paymentId },
        });
        if (
          !current ||
          current.orderId !== event.orderId ||
          current.providerTransactionId !== event.providerTransactionId ||
          normalizeMoney(current.amount.toString()) !== event.amount ||
          current.currency !== event.currency ||
          current.method !== PaymentMethod.MOCK_ONLINE
        ) {
          throw new InvalidProviderEventError(
            "Provider event does not match the payment",
          );
        }

        await transaction.providerWebhookEvent.create({
          data: {
            provider: event.provider,
            providerEventId: event.providerEventId,
            paymentId: event.paymentId,
            providerTransactionId: event.providerTransactionId,
            outcome: event.status,
          },
        });

        if (current.status === PaymentStatus.PROCESSING) {
          const update = await transaction.payment.updateMany({
            where: {
              id: current.id,
              status: PaymentStatus.PROCESSING,
              providerTransactionId: event.providerTransactionId,
            },
            data:
              event.status === PaymentStatus.SUCCEEDED
                ? {
                    status: PaymentStatus.SUCCEEDED,
                    failureCode: null,
                    orderSyncStatus: OrderSyncStatus.PENDING,
                    nextOrderSyncAt: new Date(),
                  }
                : {
                    status: PaymentStatus.FAILED,
                    failureCode: event.failureCode,
                    orderSyncStatus: OrderSyncStatus.NOT_REQUIRED,
                    nextOrderSyncAt: null,
                  },
          });
          const latest = await transaction.payment.findUniqueOrThrow({
            where: { id: current.id },
          });
          if (update.count === 1) {
            return { payment: toDomain(latest), duplicate: false };
          }
          if (latest.status === event.status) {
            return { payment: toDomain(latest), duplicate: true };
          }
          throw new InvalidProviderEventError(
            "Provider event conflicts with the terminal payment status",
          );
        }

        const sameTerminalOutcome = current.status === event.status;
        if (!sameTerminalOutcome) {
          throw new InvalidProviderEventError(
            "Provider event conflicts with the terminal payment status",
          );
        }
        return { payment: toDomain(current), duplicate: true };
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const existingEvent = await this.database.providerWebhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: event.provider,
            providerEventId: event.providerEventId,
          },
        },
        include: { payment: true },
      });
      if (!existingEvent) throw error;
      if (
        existingEvent.paymentId !== event.paymentId ||
        existingEvent.providerTransactionId !== event.providerTransactionId ||
        existingEvent.outcome !== event.status
      ) {
        throw new InvalidProviderEventError(
          "Provider event id was reused with different content",
        );
      }
      return { payment: toDomain(existingEvent.payment), duplicate: true };
    }
  }

  async markOrderSynced(id: string, refundRequired = false) {
    return toDomain(
      await this.database.payment.update({
        where: { id },
        data: {
          orderSyncStatus: OrderSyncStatus.SYNCED,
          orderSyncedAt: new Date(),
          nextOrderSyncAt: null,
          ...(refundRequired
            ? {
                resolutionStatus: PaymentResolutionStatus.REFUND_REQUIRED,
                resolutionReason: "ORDER_CANCELLED_AFTER_PAYMENT",
              }
            : {}),
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
