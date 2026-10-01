import type {
  CursorPage,
  CursorQuery,
  IOrderRepository,
} from "../interface/order-repository.js";
import type { Order } from "../model/order.js";
import { toCursorPage } from "./pagination.js";

export class ListCustomerOrdersQueryHandler {
  constructor(private readonly orders: IOrderRepository) {}

  async query(
    customerUserId: string,
    pagination: CursorQuery,
  ): Promise<CursorPage<Order>> {
    const orders = await this.orders.findCustomerPage(
      customerUserId,
      pagination,
    );
    return toCursorPage(orders, pagination.limit);
  }
}
