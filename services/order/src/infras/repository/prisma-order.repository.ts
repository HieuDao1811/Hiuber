import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  PrismaClient,
} from "../../generated/prisma/client.js";
import type {
  CreateOrderData,
  CursorQuery,
  IOrderRepository,
} from "../../interface/order-repository.js";
import type { Order } from "../../model/order.js";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../share/enums/index.js";

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

const toDomainOrder = (order: PrismaOrderWithItems): Order => ({
  id: order.id,
  customerUserId: order.customerUserId,
  restaurantId: order.restaurantId,
  status: OrderStatus[order.status],
  paymentMethod: order.paymentMethod
    ? PaymentMethod[order.paymentMethod]
    : null,
  paymentStatus: PaymentStatus[order.paymentStatus],
  addressLabel: order.addressLabel,
  deliveryAddress: order.deliveryAddress,
  receiverName: order.receiverName,
  receiverPhone: order.receiverPhone,
  subtotal: order.subtotal.toString(),
  deliveryFee: order.deliveryFee.toString(),
  totalPrice: order.totalPrice.toString(),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: order.items.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    name: item.name,
    unitPrice: item.unitPrice.toString(),
    quantity: item.quantity,
    lineTotal: item.lineTotal.toString(),
  })),
});

const pageArguments = (query: CursorQuery) => ({
  orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
  take: query.limit + 1,
  ...(query.cursor
    ? {
        cursor: { id: query.cursor },
        skip: 1,
      }
    : {}),
  include: { items: { orderBy: { id: "asc" as const } } },
});

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly database: PrismaClient) {}

  async createAtomic(data: CreateOrderData): Promise<Order> {
    const order = await this.database.$transaction((transaction) =>
      transaction.order.create({
        data: {
          customerUserId: data.customerUserId,
          restaurantId: data.restaurantId,
          addressLabel: data.addressLabel,
          deliveryAddress: data.deliveryAddress,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          totalPrice: data.totalPrice,
          items: { create: data.items },
        },
        include: { items: { orderBy: { id: "asc" } } },
      }),
    );

    return toDomainOrder(order);
  }

  async findCustomerPage(
    customerUserId: string,
    query: CursorQuery,
  ): Promise<Order[]> {
    const orders = await this.database.order.findMany({
      where: { customerUserId },
      ...pageArguments(query),
    });
    return orders.map(toDomainOrder);
  }

  async findRestaurantPage(
    restaurantId: string,
    query: CursorQuery,
  ): Promise<Order[]> {
    const orders = await this.database.order.findMany({
      where: { restaurantId },
      ...pageArguments(query),
    });
    return orders.map(toDomainOrder);
  }

  async findByIdForCustomer(
    orderId: string,
    customerUserId: string,
  ): Promise<Order | null> {
    const order = await this.database.order.findFirst({
      where: { id: orderId, customerUserId },
      include: { items: { orderBy: { id: "asc" } } },
    });
    return order ? toDomainOrder(order) : null;
  }

  async findByIdForRestaurant(
    orderId: string,
    restaurantId: string,
  ): Promise<Order | null> {
    const order = await this.database.order.findFirst({
      where: { id: orderId, restaurantId },
      include: { items: { orderBy: { id: "asc" } } },
    });
    return order ? toDomainOrder(order) : null;
  }

  async findById(orderId: string): Promise<Order | null> {
    const order = await this.database.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { id: "asc" } } },
    });
    return order ? toDomainOrder(order) : null;
  }

  updateStatus(
    orderId: string,
    restaurantId: string,
    expectedStatus: OrderStatus,
    status: OrderStatus,
  ): Promise<Order | null> {
    return this.database.$transaction(async (transaction) => {
      const update = await transaction.order.updateMany({
        where: { id: orderId, restaurantId, status: expectedStatus },
        data: { status },
      });
      if (update.count === 0) {
        return null;
      }

      const order = await transaction.order.findFirst({
        where: { id: orderId, restaurantId },
        include: { items: { orderBy: { id: "asc" } } },
      });
      return order ? toDomainOrder(order) : null;
    });
  }


  syncPaymentStatus(
    orderId: string,
    method: PaymentMethod,
    status: PaymentStatus,
  ): Promise<Order | null> {
    return this.database.$transaction(async (transaction) => {
      const updated = await transaction.order.updateMany({
        where: {
          id: orderId,
          OR: [{ paymentMethod: null }, { paymentMethod: method }],
          ...(status === PaymentStatus.PAID
            ? { paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PAID] } }
            : { paymentStatus: PaymentStatus.UNPAID }),
        },
        data: { paymentMethod: method, paymentStatus: status },
      });
      if (updated.count === 0) return null;

      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { items: { orderBy: { id: "asc" } } },
      });
      return order ? toDomainOrder(order) : null;
    });
  }
}
