import type { Notification } from "../model/notification.js";
import type { StoredOrderEvent } from "../model/order-event.js";

export interface IRealtimePublisher {
  publish(event: StoredOrderEvent, notifications: Notification[]): void;
}
