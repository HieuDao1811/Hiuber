import { orderApi } from "../axios";
import type { Notification } from "./notification.type";

export const listNotifications = async (cursor?: string) => {
  const response = await orderApi.get<{
    data: Notification[];
    pagination: { nextCursor: string | null };
  }>("/v1/notifications", {
    params: { limit: 20, ...(cursor ? { cursor } : {}) },
  });
  return response.data;
};

export const countUnreadNotifications = async () =>
  (
    await orderApi.get<{ data: { count: number } }>(
      "/v1/notifications/unread-count",
    )
  ).data.data.count;

export const markNotificationRead = async (notificationId: string) =>
  (
    await orderApi.patch<{ data: Notification }>(
      `/v1/notifications/${notificationId}/read`,
    )
  ).data.data;

export const markAllNotificationsRead = async () =>
  (
    await orderApi.patch<{ data: { updatedCount: number } }>(
      "/v1/notifications/read-all",
    )
  ).data.data.updatedCount;
