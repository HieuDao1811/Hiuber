import type { OrderEventType } from "../share/enums/index.js";

export const RealtimeEventName = {
  ORDER_CREATED: "order.created",
  ORDER_STATUS_UPDATED: "order.status.updated",
  PAYMENT_STATUS_UPDATED: "payment.status.updated",
  NOTIFICATION_CREATED: "notification.created",
  AUTH_EXPIRED: "auth.expired",
} as const;

export const businessEventName = (type: OrderEventType): string =>
  RealtimeEventName[type];

export const personalRoom = (userId: string) => `user:${userId}`;
export const orderRoom = (orderId: string) => `order:${orderId}`;
export const restaurantRoom = (restaurantId: string) =>
  `restaurant:${restaurantId}`;
