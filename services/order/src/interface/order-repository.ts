import type { Order } from "../model/order.js";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

export interface CursorQuery {
  limit: number;
  cursor?: string;
}

export interface CursorPage<Item> {
  items: Item[];
  nextCursor: string | null;
}

export interface CreateOrderData {
  customerUserId: string;
  restaurantId: string;
  addressLabel: string | null;
  deliveryAddress: string;
  receiverName: string;
  receiverPhone: string;
  subtotal: string;
  deliveryFee: string;
  totalPrice: string;
  items: Array<{
    menuItemId: string;
    name: string;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
}

export interface IOrderRepository {
  createAtomic(data: CreateOrderData): Promise<Order>;
  findCustomerPage(
    customerUserId: string,
    query: CursorQuery,
  ): Promise<Order[]>;
  findRestaurantPage(
    restaurantId: string,
    query: CursorQuery,
  ): Promise<Order[]>;
  findByIdForCustomer(
    orderId: string,
    customerUserId: string,
  ): Promise<Order | null>;
  findByIdForRestaurant(
    orderId: string,
    restaurantId: string,
  ): Promise<Order | null>;
  findById(orderId: string): Promise<Order | null>;
  updateStatus(
    orderId: string,
    restaurantId: string,
    expectedStatus: OrderStatus,
    status: OrderStatus,
  ): Promise<Order | null>;
  syncPaymentStatus(
    orderId: string,
    method: PaymentMethod,
    status: PaymentStatus,
  ): Promise<Order | null>;
}
