import type { OrderEventType } from "../share/enums/index.js";

export interface Notification {
  id: string;
  recipientUserId: string;
  type: OrderEventType;
  title: string;
  message: string;
  orderId: string | null;
  sourceEventId: string;
  orderVersion: number | null;
  readAt: Date | null;
  createdAt: Date;
}

export type PublicNotification = Omit<Notification, "recipientUserId">;

export const toPublicNotification = ({
  recipientUserId: _recipientUserId,
  ...notification
}: Notification): PublicNotification => notification;
