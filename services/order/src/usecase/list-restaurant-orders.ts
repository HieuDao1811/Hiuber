import type {
  CursorPage,
  CursorQuery,
  IOrderRepository,
} from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import type { Order } from "../model/order.js";
import { toCursorPage } from "./pagination.js";
import { assertRestaurantOwner } from "./restaurant-access.js";

export class ListRestaurantOrdersQueryHandler {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly restaurants: IRestaurantService,
  ) {}

  async query(
    restaurantId: string,
    ownerUserId: string,
    pagination: CursorQuery,
  ): Promise<CursorPage<Order>> {
    await assertRestaurantOwner(
      this.restaurants,
      restaurantId,
      ownerUserId,
    );
    const orders = await this.orders.findRestaurantPage(
      restaurantId,
      pagination,
    );
    return toCursorPage(orders, pagination.limit);
  }
}
