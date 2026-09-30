import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import type { Requester } from "../model/requester.js";
import { ForbiddenError, OrderNotFoundError } from "../model/errors.js";
import { UserRole } from "../share/enums/index.js";
import { assertRestaurantOwner } from "../usecase/restaurant-access.js";

export class RealtimeSubscriptionAuthorizer {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly restaurants: IRestaurantService,
  ) {}

  async authorizeOrder(requester: Requester, orderId: string): Promise<void> {
    if (requester.role === UserRole.CUSTOMER) {
      const order = await this.orders.findByIdForCustomer(
        orderId,
        requester.userId,
      );
      if (!order) throw new ForbiddenError("You cannot subscribe to this order");
      return;
    }
    if (requester.role === UserRole.RESTAURANT) {
      const order = await this.orders.findById(orderId);
      if (!order) throw new OrderNotFoundError();
      await assertRestaurantOwner(
        this.restaurants,
        order.restaurantId,
        requester.userId,
      );
      return;
    }
    throw new ForbiddenError("Role cannot subscribe to orders");
  }

  async authorizeRestaurant(
    requester: Requester,
    restaurantId: string,
  ): Promise<void> {
    if (requester.role !== UserRole.RESTAURANT) {
      throw new ForbiddenError("Role cannot subscribe to restaurants");
    }
    await assertRestaurantOwner(
      this.restaurants,
      restaurantId,
      requester.userId,
    );
  }
}
