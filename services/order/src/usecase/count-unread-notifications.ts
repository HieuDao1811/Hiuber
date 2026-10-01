import type { INotificationRepository } from "../interface/notification-repository.js";

export class CountUnreadNotificationsQueryHandler {
  constructor(private readonly notifications: INotificationRepository) {}

  async query(recipientUserId: string) {
    return { count: await this.notifications.countUnread(recipientUserId) };
  }
}
