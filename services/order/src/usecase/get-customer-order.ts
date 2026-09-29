import type { IOrderRepository } from "../interface/order-repository.js";
import type { Order } from "../model/order.js";
import { OrderNotFoundError } from "../model/errors.js";

export class GetCustomerOrderQueryHandler {
  constructor(private readonly orders: IOrderRepository) {}

  async query(orderId: string, customerUserId: string): Promise<Order> {
    const order = await this.orders.findByIdForCustomer(
      orderId,
      customerUserId,
    );
    if (!order) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
