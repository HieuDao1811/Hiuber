import { orderApi } from "../axios";
import type { Order } from "./order.type";

interface DataResponse<Data> {
  data: Data;
}

interface PageResponse<Data> {
  data: Data[];
  pagination: { nextCursor: string | null };
}

export const getCustomerOrder = async (orderId: string) =>
  (await orderApi.get<DataResponse<Order>>(`/v1/orders/${orderId}`)).data.data;

export const getRestaurantOrder = async (
  restaurantId: string,
  orderId: string,
) =>
  (
    await orderApi.get<DataResponse<Order>>(
      `/v1/restaurants/${restaurantId}/orders/${orderId}`,
    )
  ).data.data;

export const listCustomerOrders = async () =>
  (await orderApi.get<PageResponse<Order>>("/v1/orders?limit=20")).data.data;
