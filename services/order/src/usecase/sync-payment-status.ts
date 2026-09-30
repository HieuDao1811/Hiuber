import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import { newOrderEvent } from "../model/order-event.js";
import {
  OrderNotFoundError,
  PaymentMethodConflictError,
  PaymentStatusConflictError,
} from "../model/errors.js";
import {
  OrderEventType,
  PaymentStatus,
  type PaymentMethod,
} from "../share/enums/index.js";

export class SyncPaymentStatusCommandHandler {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly restaurants: IRestaurantService,
  ) {}

  async execute(command: {
    orderId: string;
    method: PaymentMethod;
    status: PaymentStatus;
  }) {
    const current = await this.orders.findById(command.orderId);
    if (!current) throw new OrderNotFoundError();
    if (current.paymentMethod && current.paymentMethod !== command.method) {
      throw new PaymentMethodConflictError();
    }
    if (
      current.paymentStatus === PaymentStatus.PAID &&
      command.status === PaymentStatus.UNPAID
    ) {
      throw new PaymentStatusConflictError();
    }
    if (
      current.paymentMethod === command.method &&
      current.paymentStatus === command.status
    ) {
      return current;
    }

    const restaurant = await this.restaurants.getOrderContext(
      current.restaurantId,
      [],
    );

    const updated = await this.orders.syncPaymentStatus(
      command.orderId,
      command.method,
      command.status,
      newOrderEvent(
        OrderEventType.PAYMENT_STATUS_UPDATED,
        restaurant.restaurant.ownerUserId,
        [
          {
            recipientUserId: current.customerUserId,
            title: "Payment status updated",
            message: `Your payment is now ${command.status}.`,
          },
          {
            recipientUserId: restaurant.restaurant.ownerUserId,
            title: "Payment status updated",
            message: `Payment for the order is now ${command.status}.`,
          },
        ],
      ),
    );
    if (!updated) {
      const concurrent = await this.orders.findById(command.orderId);
      if (
        concurrent?.paymentMethod === command.method &&
        concurrent.paymentStatus === command.status
      ) {
        return concurrent;
      }
      throw new PaymentMethodConflictError();
    }
    return updated;
  }
}
