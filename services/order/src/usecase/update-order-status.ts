import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import type { Order } from "../model/order.js";
import { newOrderEvent } from "../model/order-event.js";
import {
  ConcurrentOrderUpdateError,
  InvalidOrderStatusTransitionError,
  OrderNotFoundError,
} from "../model/errors.js";
import { OrderEventType, OrderStatus } from "../share/enums/index.js";
import { assertRestaurantOwner } from "./restaurant-access.js";

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export class UpdateOrderStatusCommandHandler {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly restaurants: IRestaurantService,
  ) {}

  async execute(command: {
    orderId: string;
    restaurantId: string;
    ownerUserId: string;
    status: OrderStatus;
  }): Promise<Order> {
    await assertRestaurantOwner(
      this.restaurants,
      command.restaurantId,
      command.ownerUserId,
    );
    const order = await this.orders.findByIdForRestaurant(
      command.orderId,
      command.restaurantId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    if (!ALLOWED_TRANSITIONS[order.status].includes(command.status)) {
      throw new InvalidOrderStatusTransitionError();
    }

    const updated = await this.orders.updateStatus(
      order.id,
      order.restaurantId,
      order.status,
      command.status,
      newOrderEvent(
        OrderEventType.ORDER_STATUS_UPDATED,
        command.ownerUserId,
        [
          {
            recipientUserId: order.customerUserId,
            title: "Order status updated",
            message: `Your order is now ${command.status}.`,
          },
          {
            recipientUserId: command.ownerUserId,
            title: "Order status updated",
            message: `The order is now ${command.status}.`,
          },
        ],
      ),
    );
    if (!updated) {
      throw new ConcurrentOrderUpdateError();
    }
    return updated;
  }
}
