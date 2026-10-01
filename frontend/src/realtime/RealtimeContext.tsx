import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications/notification.api";
import type { Notification } from "../services/notifications/notification.type";
import { clearSession, getAccessToken } from "../services/session";
import { connectRealtime, disconnectRealtime } from "./socket";
import type {
  RealtimeNotificationEvent,
  RealtimeOrderEvent,
} from "./realtime.type";
import { RealtimeContext } from "./context";

const BUSINESS_EVENTS = [
  "order.created",
  "order.status.updated",
  "payment.status.updated",
] as const;

const remember = (seen: Set<string>, eventId: string) => {
  if (seen.has(eventId)) return false;
  seen.add(eventId);
  if (seen.size > 500) seen.delete(seen.values().next().value!);
  return true;
};

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuth, setIsAuth, setUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [orderEvents, setOrderEvents] = useState<
    Record<string, RealtimeOrderEvent>
  >({});
  const [syncEpoch, setSyncEpoch] = useState(0);
  const seenEvents = useRef(new Set<string>());
  const knownNotificationIds = useRef(new Set<string>());
  const latestOrderVersions = useRef(new Map<string, number>());
  const orderSubscriptions = useRef(new Set<string>());
  const restaurantSubscriptions = useRef(new Set<string>());

  const refreshNotifications = useCallback(async () => {
    const [page, count] = await Promise.all([
      listNotifications(),
      countUnreadNotifications(),
    ]);
    knownNotificationIds.current = new Set(page.data.map((item) => item.id));
    setNotifications(page.data);
    setNextCursor(page.pagination.nextCursor);
    setUnreadCount(count);
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    if (!nextCursor) return;
    const page = await listNotifications(nextCursor);
    page.data.forEach((item) => knownNotificationIds.current.add(item.id));
    setNotifications((current) => {
      const known = new Set(current.map((item) => item.id));
      return [...current, ...page.data.filter((item) => !known.has(item.id))];
    });
    setNextCursor(page.pagination.nextCursor);
  }, [nextCursor]);

  const markRead = useCallback(async (notificationId: string) => {
    const updated = await markNotificationRead(notificationId);
    setNotifications((current) => {
      const wasUnread = current.some(
        (item) => item.id === updated.id && !item.readAt,
      );
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
      return current.map((item) => (item.id === updated.id ? updated : item));
    });
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
    );
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!isAuth) {
      disconnectRealtime();
      seenEvents.current.clear();
      knownNotificationIds.current.clear();
      latestOrderVersions.current.clear();
      orderSubscriptions.current.clear();
      restaurantSubscriptions.current.clear();
      const resetTimer = window.setTimeout(() => {
        setIsConnected(false);
        setNotifications([]);
        setUnreadCount(0);
        setNextCursor(null);
        setOrderEvents({});
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const socket = connectRealtime(accessToken);

    const onConnect = () => {
      setIsConnected(true);
      setSyncEpoch((value) => value + 1);
      orderSubscriptions.current.forEach((orderId) =>
        socket.emit("order:subscribe", { orderId }),
      );
      restaurantSubscriptions.current.forEach((restaurantId) =>
        socket.emit("restaurant:subscribe", { restaurantId }),
      );
      void refreshNotifications().catch(() => {
        toast.error("Không thể đồng bộ thông báo");
      });
    };
    const onDisconnect = () => setIsConnected(false);
    const onAuthExpired = () => {
      disconnectRealtime();
      clearSession();
      setIsAuth(false);
      setUser(null);
      toast.error("Phiên đăng nhập đã hết hạn");
    };
    const onConnectError = (error: Error) => {
      if (error.message === "UNAUTHENTICATED") onAuthExpired();
    };
    const onBusinessEvent = (event: RealtimeOrderEvent) => {
      if (!remember(seenEvents.current, event.eventId)) return;
      const latestVersion = latestOrderVersions.current.get(event.orderId) ?? 0;
      if (latestVersion >= event.version) return;
      latestOrderVersions.current.set(event.orderId, event.version);
      setOrderEvents((current) => {
        const previous = current[event.orderId];
        if (previous && previous.version >= event.version) return current;
        return { ...current, [event.orderId]: event };
      });
      toast.success(
        event.paymentStatus === "PAID"
          ? "Thanh toán đã được xác nhận"
          : `Đơn hàng đã cập nhật: ${event.orderStatus}`,
      );
    };
    const onNotification = (event: RealtimeNotificationEvent) => {
      if (!remember(seenEvents.current, event.eventId)) return;
      if (knownNotificationIds.current.has(event.notification.id)) return;
      knownNotificationIds.current.add(event.notification.id);
      setNotifications((current) => [event.notification, ...current]);
      if (!event.notification.readAt) {
        setUnreadCount((count) => count + 1);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("auth.expired", onAuthExpired);
    socket.on("notification.created", onNotification);
    BUSINESS_EVENTS.forEach((eventName) =>
      socket.on(eventName, onBusinessEvent),
    );
    const initialSyncTimer = window.setTimeout(() => {
      void refreshNotifications().catch(() => {
        toast.error("Không thể đồng bộ thông báo");
      });
    }, 0);
    if (socket.connected) onConnect();

    return () => {
      window.clearTimeout(initialSyncTimer);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("auth.expired", onAuthExpired);
      socket.off("notification.created", onNotification);
      BUSINESS_EVENTS.forEach((eventName) =>
        socket.off(eventName, onBusinessEvent),
      );
      disconnectRealtime();
    };
  }, [isAuth, refreshNotifications, setIsAuth, setUser]);

  const subscribeOrder = useCallback((orderId: string) => {
    orderSubscriptions.current.add(orderId);
    const accessToken = getAccessToken();
    if (!accessToken) {
      return () => orderSubscriptions.current.delete(orderId);
    }
    const socket = connectRealtime(accessToken);
    socket.emit("order:subscribe", { orderId });
    return () => {
      orderSubscriptions.current.delete(orderId);
      socket.emit("order:unsubscribe", { orderId });
    };
  }, []);

  const subscribeRestaurant = useCallback((restaurantId: string) => {
    restaurantSubscriptions.current.add(restaurantId);
    const accessToken = getAccessToken();
    if (!accessToken) {
      return () => restaurantSubscriptions.current.delete(restaurantId);
    }
    const socket = connectRealtime(accessToken);
    socket.emit("restaurant:subscribe", { restaurantId });
    return () => {
      restaurantSubscriptions.current.delete(restaurantId);
      socket.emit("restaurant:unsubscribe", { restaurantId });
    };
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        notifications,
        unreadCount,
        nextCursor,
        orderEvents,
        syncEpoch,
        refreshNotifications,
        loadMoreNotifications,
        markRead,
        markAllRead,
        subscribeOrder,
        subscribeRestaurant,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};
