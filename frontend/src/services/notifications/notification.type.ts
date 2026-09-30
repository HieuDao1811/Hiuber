export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_UPDATED"
  | "PAYMENT_STATUS_UPDATED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId: string | null;
  sourceEventId: string;
  orderVersion: number | null;
  readAt: string | null;
  createdAt: string;
}
