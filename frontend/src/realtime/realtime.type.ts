import type { Notification } from "../services/notifications/notification.type";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../services/orders/order.type";

export interface RealtimeOrderEvent {
  eventId: string;
  orderId: string;
  occurredAt: string;
  version: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

export interface RealtimeNotificationEvent {
  eventId: string;
  occurredAt: string;
  version: number | null;
  notification: Notification;
}

export interface RealtimeContextValue {
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  orderEvents: Record<string, RealtimeOrderEvent>;
  syncEpoch: number;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  subscribeOrder: (orderId: string) => () => void;
  subscribeRestaurant: (restaurantId: string) => () => void;
}
