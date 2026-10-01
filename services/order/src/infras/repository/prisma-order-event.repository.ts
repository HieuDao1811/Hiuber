import type {
  OrderEventOutbox,
  PrismaClient,
} from "../../generated/prisma/client.js";
import type { IOrderEventRepository } from "../../interface/order-event-repository.js";
import type { StoredOrderEvent } from "../../model/order-event.js";
import {
  OrderEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../share/enums/index.js";

const toDomain = (event: OrderEventOutbox): StoredOrderEvent => ({
  eventId: event.eventId,
  type: OrderEventType[event.type],
  orderId: event.orderId,
  orderVersion: event.orderVersion,
  orderStatus: OrderStatus[event.orderStatus],
  paymentStatus: PaymentStatus[event.paymentStatus],
  paymentMethod: event.paymentMethod
    ? PaymentMethod[event.paymentMethod]
    : null,
  customerUserId: event.customerUserId,
  restaurantOwnerUserId: event.restaurantOwnerUserId,
  restaurantId: event.restaurantId,
  occurredAt: event.occurredAt,
  attempts: event.attempts,
});

export class PrismaOrderEventRepository implements IOrderEventRepository {
  constructor(private readonly database: PrismaClient) {}

  async findDue(now: Date, limit: number) {
    const events = await this.database.orderEventOutbox.findMany({
      where: { dispatchedAt: null, nextAttemptAt: { lte: now } },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
    return events.map(toDomain);
  }

  async markDispatched(eventId: string, dispatchedAt: Date) {
    await this.database.orderEventOutbox.update({
      where: { eventId },
      data: { dispatchedAt },
    });
  }

  async recordFailure(eventId: string, nextAttemptAt: Date) {
    await this.database.orderEventOutbox.update({
      where: { eventId },
      data: { attempts: { increment: 1 }, nextAttemptAt },
    });
  }
}
