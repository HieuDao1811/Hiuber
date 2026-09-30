import type { INotificationRepository } from "../interface/notification-repository.js";

export class MarkAllNotificationsReadCommandHandler {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(recipientUserId: string) {
    return {
      updatedCount: await this.notifications.markAllRead(
        recipientUserId,
        this.now(),
      ),
    };
  }
}
