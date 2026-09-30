import type { INotificationRepository } from "../interface/notification-repository.js";
import { NotificationNotFoundError } from "../model/errors.js";
import { toPublicNotification } from "../model/notification.js";

export class MarkNotificationReadCommandHandler {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(id: string, recipientUserId: string) {
    const notification = await this.notifications.markRead(
      id,
      recipientUserId,
      this.now(),
    );
    if (!notification) throw new NotificationNotFoundError();
    return toPublicNotification(notification);
  }
}
