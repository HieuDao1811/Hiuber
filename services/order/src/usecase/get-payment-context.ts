import type { IOrderRepository } from "../interface/order-repository.js";
import { OrderNotFoundError } from "../model/errors.js";

export class GetPaymentContextQueryHandler {
  constructor(private readonly orders: IOrderRepository) {}

  async query(orderId: string) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundError();

    return {
      id: order.id,
      customerUserId: order.customerUserId,
      status: order.status,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
  }
}
