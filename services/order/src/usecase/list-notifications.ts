import type { INotificationRepository } from "../interface/notification-repository.js";
import type { CursorQuery } from "../interface/order-repository.js";
import { toPublicNotification } from "../model/notification.js";

export class ListNotificationsQueryHandler {
  constructor(private readonly notifications: INotificationRepository) {}

  async query(recipientUserId: string, pagination: CursorQuery) {
    const page = await this.notifications.findPage(recipientUserId, pagination);
    return {
      items: page.items.map(toPublicNotification),
      nextCursor: page.nextCursor,
    };
  }
}
