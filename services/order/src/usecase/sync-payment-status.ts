import type { IOrderRepository } from "../interface/order-repository.js";
import {
  OrderNotFoundError,
  PaymentMethodConflictError,
  PaymentStatusConflictError,
} from "../model/errors.js";
import {
  PaymentStatus,
  type PaymentMethod,
} from "../share/enums/index.js";

export class SyncPaymentStatusCommandHandler {
  constructor(private readonly orders: IOrderRepository) {}

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

    const updated = await this.orders.syncPaymentStatus(
      command.orderId,
      command.method,
      command.status,
    );
    if (!updated) throw new PaymentMethodConflictError();
    return updated;
  }
}
