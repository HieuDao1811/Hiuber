import type { CursorPage, CursorQuery } from "./order-repository.js";
import type { Notification } from "../model/notification.js";

export interface INotificationRepository {
  findPage(
    recipientUserId: string,
    query: CursorQuery,
  ): Promise<CursorPage<Notification>>;
  countUnread(recipientUserId: string): Promise<number>;
  markRead(id: string, recipientUserId: string, readAt: Date): Promise<Notification | null>;
  markAllRead(recipientUserId: string, readAt: Date): Promise<number>;
  findBySourceEvent(sourceEventId: string): Promise<Notification[]>;
}
