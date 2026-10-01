import { randomUUID } from "node:crypto";
import type { Notification } from "./notification.js";
import type {
  OrderEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface NotificationSpec {
  recipientUserId: string;
  title: string;
  message: string;
}

export interface OrderEventSpec {
  eventId: string;
  type: OrderEventType;
  restaurantOwnerUserId: string;
  notifications: NotificationSpec[];
}

export interface StoredOrderEvent {
  eventId: string;
  type: OrderEventType;
  orderId: string;
  orderVersion: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  customerUserId: string;
  restaurantOwnerUserId: string;
  restaurantId: string;
  occurredAt: Date;
  attempts: number;
}

export interface RealtimeOrderEvent {
  eventId: string;
  orderId: string;
  occurredAt: string;
  version: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
}

export interface RealtimeNotificationEvent {
  eventId: string;
  occurredAt: string;
  version: number | null;
  notification: Omit<Notification, "recipientUserId">;
}

export const newOrderEvent = (
  type: OrderEventType,
  restaurantOwnerUserId: string,
  notifications: NotificationSpec[],
): OrderEventSpec => ({
  eventId: randomUUID(),
  type,
  restaurantOwnerUserId,
  notifications: Array.from(
    new Map(
      notifications.map((notification) => [
        notification.recipientUserId,
        notification,
      ]),
    ).values(),
  ),
});
