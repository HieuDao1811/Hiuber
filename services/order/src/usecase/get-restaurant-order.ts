import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import type { Order } from "../model/order.js";
import { OrderNotFoundError } from "../model/errors.js";
import { assertRestaurantOwner } from "./restaurant-access.js";

export class GetRestaurantOrderQueryHandler {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly restaurants: IRestaurantService,
  ) {}

  async query(
    orderId: string,
    restaurantId: string,
    ownerUserId: string,
  ): Promise<Order> {
    await assertRestaurantOwner(
      this.restaurants,
      restaurantId,
      ownerUserId,
    );
    const order = await this.orders.findByIdForRestaurant(
      orderId,
      restaurantId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
