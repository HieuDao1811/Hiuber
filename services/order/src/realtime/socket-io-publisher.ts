import type { Server } from "socket.io";
import type { IRealtimePublisher } from "../interface/realtime-publisher.js";
import { toPublicNotification } from "../model/notification.js";
import type {
  RealtimeNotificationEvent,
  RealtimeOrderEvent,
  StoredOrderEvent,
} from "../model/order-event.js";
import type { Notification } from "../model/notification.js";
import {
  businessEventName,
  orderRoom,
  personalRoom,
  RealtimeEventName,
  restaurantRoom,
} from "./events.js";

export class SocketIoRealtimePublisher implements IRealtimePublisher {
  constructor(private readonly io: Server) {}

  publish(event: StoredOrderEvent, notifications: Notification[]): void {
    const payload: RealtimeOrderEvent = {
      eventId: event.eventId,
      orderId: event.orderId,
      occurredAt: event.occurredAt.toISOString(),
      version: event.orderVersion,
      orderStatus: event.orderStatus,
      paymentStatus: event.paymentStatus,
      paymentMethod: event.paymentMethod,
    };
    this.io
      .to(personalRoom(event.customerUserId))
      .to(personalRoom(event.restaurantOwnerUserId))
      .to(restaurantRoom(event.restaurantId))
      .to(orderRoom(event.orderId))
      .emit(businessEventName(event.type), payload);

    for (const notification of notifications) {
      const notificationPayload: RealtimeNotificationEvent = {
        eventId: notification.id,
        occurredAt: notification.createdAt.toISOString(),
        version: notification.orderVersion,
        notification: toPublicNotification(notification),
      };
      this.io
        .to(personalRoom(notification.recipientUserId))
        .emit(RealtimeEventName.NOTIFICATION_CREATED, notificationPayload);
    }
  }
}
