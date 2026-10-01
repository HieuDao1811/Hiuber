import type {
  Notification as PrismaNotification,
  PrismaClient,
} from "../../generated/prisma/client.js";
import type { INotificationRepository } from "../../interface/notification-repository.js";
import type { CursorQuery } from "../../interface/order-repository.js";
import type { Notification } from "../../model/notification.js";
import { OrderEventType } from "../../share/enums/index.js";

const toDomain = (notification: PrismaNotification): Notification => ({
  id: notification.id,
  recipientUserId: notification.recipientUserId,
  type: OrderEventType[notification.type],
  title: notification.title,
  message: notification.message,
  orderId: notification.orderId,
  sourceEventId: notification.sourceEventId,
  orderVersion: notification.orderVersion,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly database: PrismaClient) {}

  async findPage(recipientUserId: string, query: CursorQuery) {
    const records = await this.database.notification.findMany({
      where: { recipientUserId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    });
    const hasNext = records.length > query.limit;
    const items = records.slice(0, query.limit).map(toDomain);
    return {
      items,
      nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null,
    };
  }

  countUnread(recipientUserId: string) {
    return this.database.notification.count({
      where: { recipientUserId, readAt: null },
    });
  }

  async markRead(id: string, recipientUserId: string, readAt: Date) {
    const update = await this.database.notification.updateMany({
      where: { id, recipientUserId, readAt: null },
      data: { readAt },
    });
    if (update.count === 0) {
      const existing = await this.database.notification.findFirst({
        where: { id, recipientUserId },
      });
      return existing ? toDomain(existing) : null;
    }
    return toDomain(
      await this.database.notification.findUniqueOrThrow({ where: { id } }),
    );
  }

  async markAllRead(recipientUserId: string, readAt: Date) {
    const update = await this.database.notification.updateMany({
      where: { recipientUserId, readAt: null },
      data: { readAt },
    });
    return update.count;
  }

  async findBySourceEvent(sourceEventId: string) {
    const records = await this.database.notification.findMany({
      where: { sourceEventId },
      orderBy: { id: "asc" },
    });
    return records.map(toDomain);
  }
}
