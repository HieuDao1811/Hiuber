import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { PrismaClient } from "../generated/prisma/client.js";
import { PrismaOrderRepository } from "../infras/repository/prisma-order.repository.js";
import { CustomerRpcClient } from "../infras/rpc/customer-rpc-client.js";
import type { ICustomerService } from "../interface/customer-service.js";
import type {
  CreateOrderData,
  CursorQuery,
  IOrderRepository,
} from "../interface/order-repository.js";
import type {
  IRestaurantService,
  RestaurantOrderContext,
} from "../interface/restaurant-service.js";
import {
  CreateOrderSchema,
  type CreateOrderInput,
} from "../model/order.dto.js";
import type { Order } from "../model/order.js";
import type { OrderEventSpec } from "../model/order-event.js";
import {
  ForbiddenError,
  InvalidOrderStatusTransitionError,
  MenuItemRestaurantMismatchError,
  MenuItemUnavailableError,
  OrderNotFoundError,
  PaymentMethodConflictError,
  PaymentStatusConflictError,
} from "../model/errors.js";
import {
  OrderStatus,
  OrderEventType,
  PaymentMethod,
  PaymentStatus,
  RestaurantStatus,
} from "../share/enums/index.js";
import { CreateOrderCommandHandler } from "./create-order.js";
import { GetCustomerOrderQueryHandler } from "./get-customer-order.js";
import { ListRestaurantOrdersQueryHandler } from "./list-restaurant-orders.js";
import { UpdateOrderStatusCommandHandler } from "./update-order-status.js";
import { SyncPaymentStatusCommandHandler } from "./sync-payment-status.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_OWNER_ID = "33333333-3333-4333-8333-333333333333";
const RESTAURANT_ID = "44444444-4444-4444-8444-444444444444";
const ADDRESS_ID = "55555555-5555-4555-8555-555555555555";
const ITEM_ONE_ID = "66666666-6666-4666-8666-666666666666";
const ITEM_TWO_ID = "77777777-7777-4777-8777-777777777777";
const ORDER_ID = "88888888-8888-4888-8888-888888888888";

class MemoryOrderRepository implements IOrderRepository {
  readonly orders: Order[] = [];
  readonly events: OrderEventSpec[] = [];
  restaurantPageCalls = 0;

  async createAtomic(
    data: CreateOrderData,
    event?: OrderEventSpec,
  ): Promise<Order> {
    const now = new Date();
    const orderId = randomUUID();
    const order: Order = {
      id: orderId,
      customerUserId: data.customerUserId,
      restaurantId: data.restaurantId,
      status: OrderStatus.PENDING,
      paymentMethod: null,
      paymentStatus: PaymentStatus.UNPAID,
      currency: data.currency,
      version: 1,
      addressLabel: data.addressLabel,
      deliveryAddress: data.deliveryAddress,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      subtotal: data.subtotal,
      deliveryFee: data.deliveryFee,
      totalPrice: data.totalPrice,
      createdAt: now,
      updatedAt: now,
      items: data.items.map((item) => ({
        id: randomUUID(),
        orderId,
        ...item,
      })),
    };
    this.orders.push(order);
    if (event) this.events.push(event);
    return order;
  }

  async findCustomerPage(customerUserId: string, query: CursorQuery) {
    return this.orders
      .filter((order) => order.customerUserId === customerUserId)
      .slice(0, query.limit + 1);
  }

  async findRestaurantPage(restaurantId: string, query: CursorQuery) {
    this.restaurantPageCalls += 1;
    return this.orders
      .filter((order) => order.restaurantId === restaurantId)
      .slice(0, query.limit + 1);
  }

  async findByIdForCustomer(orderId: string, customerUserId: string) {
    return (
      this.orders.find(
        (order) =>
          order.id === orderId && order.customerUserId === customerUserId,
      ) ?? null
    );
  }

  async findByIdForRestaurant(orderId: string, restaurantId: string) {
    return (
      this.orders.find(
        (order) =>
          order.id === orderId && order.restaurantId === restaurantId,
      ) ?? null
    );
  }

  async findById(orderId: string) {
    return this.orders.find((order) => order.id === orderId) ?? null;
  }

  async updateStatus(
    orderId: string,
    restaurantId: string,
    expectedStatus: OrderStatus,
    status: OrderStatus,
    event: OrderEventSpec,
  ) {
    const order = await this.findByIdForRestaurant(orderId, restaurantId);
    if (!order || order.status !== expectedStatus) return null;
    order.status = status;
    order.version += 1;
    order.updatedAt = new Date();
    this.events.push(event);
    return order;
  }


  async syncPaymentStatus(
    orderId: string,
    method: PaymentMethod,
    status: PaymentStatus,
    event: OrderEventSpec,
  ) {
    const order = await this.findById(orderId);
    if (!order || (order.paymentMethod && order.paymentMethod !== method)) {
      return null;
    }
    order.paymentMethod = method;
    order.paymentStatus = status;
    order.version += 1;
    order.updatedAt = new Date();
    this.events.push(event);
    return order;
  }
}

const sourceAddress = {
  label: "Home" as string | null,
  receiverName: "Customer One",
  receiverPhone: "0901234567",
  address: "123 Main Street",
};

const customerService: ICustomerService = {
  getOwnedAddress: async (_accessToken, addressId) => {
    if (addressId !== ADDRESS_ID) throw new Error("address not found");
    return sourceAddress;
  },
};

const orderContext = (): RestaurantOrderContext => ({
  restaurant: {
    id: RESTAURANT_ID,
    ownerUserId: OWNER_ID,
    status: RestaurantStatus.OPEN,
  },
  menuItems: [
    {
      id: ITEM_ONE_ID,
      restaurantId: RESTAURANT_ID,
      name: "Rice",
      price: "10.05",
      isAvailable: true,
    },
    {
      id: ITEM_TWO_ID,
      restaurantId: RESTAURANT_ID,
      name: "Soup",
      price: "0.10",
      isAvailable: true,
    },
  ],
});

class FakeRestaurantService implements IRestaurantService {
  constructor(public readonly context = orderContext()) {}

  async getOrderContext(): Promise<RestaurantOrderContext> {
    return this.context;
  }
}

const createInput = (): CreateOrderInput => ({
  restaurantId: RESTAURANT_ID,
  addressId: ADDRESS_ID,
  items: [
    { menuItemId: ITEM_ONE_ID, quantity: 3 },
    { menuItemId: ITEM_TWO_ID, quantity: 2 },
  ],
});

test("create-order input rejects server-owned fields and invalid item lists", () => {
  assert.throws(() =>
    CreateOrderSchema.parse({
      ...createInput(),
      customerUserId: CUSTOMER_ID,
      deliveryFee: "0.00",
      totalPrice: "0.00",
      status: OrderStatus.COMPLETED,
    }),
  );
  assert.throws(() => CreateOrderSchema.parse({ ...createInput(), items: [] }));
  assert.throws(() =>
    CreateOrderSchema.parse({
      ...createInput(),
      items: [{ menuItemId: ITEM_ONE_ID, quantity: 0 }],
    }),
  );
  assert.throws(() =>
    CreateOrderSchema.parse({
      ...createInput(),
      items: [
        { menuItemId: ITEM_ONE_ID, quantity: 1 },
        { menuItemId: ITEM_ONE_ID, quantity: 2 },
      ],
    }),
  );
});

test("Customer RPC resolves one authenticated address by id", async () => {
  let authorization: string | null = null;
  const fetcher: typeof fetch = async (input, init) => {
    assert.equal(
      String(input),
      `http://customer.test/v1/customers/me/addresses/${ADDRESS_ID}`,
    );
    authorization = new Headers(init?.headers).get("authorization");
    return new Response(
      JSON.stringify({
        data: {
          id: ADDRESS_ID,
          label: "Home",
          receiverName: "Customer One",
          receiverPhone: "0901234567",
          address: "123 Main Street",
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const address = await new CustomerRpcClient(
    "http://customer.test",
    5_000,
    fetcher,
  ).getOwnedAddress("access-token", ADDRESS_ID);

  assert.equal(authorization, "Bearer access-token");
  assert.equal(address.address, "123 Main Street");
});

test("Restaurant RPC authenticates internal ownership and menu lookups", async () => {
  let internalKey: string | null = null;
  const fetcher: typeof fetch = async (_input, init) => {
    internalKey = new Headers(init?.headers).get("x-internal-service-key");
    return new Response(JSON.stringify(orderContext()), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const { RestaurantRpcClient } = await import(
    "../infras/rpc/restaurant-rpc-client.js"
  );
  await new RestaurantRpcClient(
    "http://restaurant.test",
    "shared-internal-key",
    5_000,
    fetcher,
  ).getOrderContext(RESTAURANT_ID, [ITEM_ONE_ID]);

  assert.equal(internalKey, "shared-internal-key");
});

test("create order calculates exact money and keeps address/menu snapshots", async () => {
  const orders = new MemoryOrderRepository();
  const restaurants = new FakeRestaurantService();
  const handler = new CreateOrderCommandHandler(
    orders,
    customerService,
    restaurants,
    "2.50",
  );

  const order = await handler.execute({
    customerUserId: CUSTOMER_ID,
    accessToken: "access-token",
    input: createInput(),
  });

  assert.equal(order.subtotal, "30.35");
  assert.equal(order.deliveryFee, "2.50");
  assert.equal(order.totalPrice, "32.85");
  assert.equal(order.currency, "VND");
  assert.equal(order.items[0]?.lineTotal, "30.15");
  assert.equal(order.items[1]?.lineTotal, "0.20");
  assert.equal(order.status, OrderStatus.PENDING);

  sourceAddress.address = "Changed address";
  restaurants.context.menuItems[0]!.name = "Changed name";
  restaurants.context.menuItems[0]!.price = "999.99";

  assert.equal(orders.orders[0]?.deliveryAddress, "123 Main Street");
  assert.equal(orders.orders[0]?.items[0]?.name, "Rice");
  assert.equal(orders.orders[0]?.items[0]?.unitPrice, "10.05");

  sourceAddress.address = "123 Main Street";
});

test("create order rejects unavailable and cross-restaurant menu items", async () => {
  const unavailableContext = orderContext();
  unavailableContext.menuItems[0]!.isAvailable = false;
  await assert.rejects(
    new CreateOrderCommandHandler(
      new MemoryOrderRepository(),
      customerService,
      new FakeRestaurantService(unavailableContext),
      "2.50",
    ).execute({
      customerUserId: CUSTOMER_ID,
      accessToken: "access-token",
      input: createInput(),
    }),
    MenuItemUnavailableError,
  );

  const mismatchContext = orderContext();
  mismatchContext.menuItems[0]!.restaurantId = randomUUID();
  await assert.rejects(
    new CreateOrderCommandHandler(
      new MemoryOrderRepository(),
      customerService,
      new FakeRestaurantService(mismatchContext),
      "2.50",
    ).execute({
      customerUserId: CUSTOMER_ID,
      accessToken: "access-token",
      input: createInput(),
    }),
    MenuItemRestaurantMismatchError,
  );
});

test("customer order lookup cannot read another customer's order", async () => {
  const orders = new MemoryOrderRepository();
  const created = await orders.createAtomic({
    customerUserId: CUSTOMER_ID,
    restaurantId: RESTAURANT_ID,
    currency: "VND",
    addressLabel: null,
    deliveryAddress: "123 Main Street",
    receiverName: "Customer One",
    receiverPhone: "0901234567",
    subtotal: "10.00",
    deliveryFee: "2.00",
    totalPrice: "12.00",
    items: [],
  });

  await assert.rejects(
    new GetCustomerOrderQueryHandler(orders).query(created.id, randomUUID()),
    OrderNotFoundError,
  );
});

test("restaurant ownership is checked before restaurant orders are queried", async () => {
  const orders = new MemoryOrderRepository();
  const handler = new ListRestaurantOrdersQueryHandler(
    orders,
    new FakeRestaurantService(),
  );

  await assert.rejects(
    handler.query(RESTAURANT_ID, OTHER_OWNER_ID, { limit: 10 }),
    ForbiddenError,
  );
  assert.equal(orders.restaurantPageCalls, 0);
});

test("restaurant status updates follow the state machine", async () => {
  const orders = new MemoryOrderRepository();
  const order = await orders.createAtomic({
    customerUserId: CUSTOMER_ID,
    restaurantId: RESTAURANT_ID,
    currency: "VND",
    addressLabel: null,
    deliveryAddress: "123 Main Street",
    receiverName: "Customer One",
    receiverPhone: "0901234567",
    subtotal: "10.00",
    deliveryFee: "2.00",
    totalPrice: "12.00",
    items: [],
  });
  const handler = new UpdateOrderStatusCommandHandler(
    orders,
    new FakeRestaurantService(),
  );

  const confirmed = await handler.execute({
    orderId: order.id,
    restaurantId: RESTAURANT_ID,
    ownerUserId: OWNER_ID,
    status: OrderStatus.CONFIRMED,
  });
  assert.equal(confirmed.status, OrderStatus.CONFIRMED);

  await assert.rejects(
    handler.execute({
      orderId: order.id,
      restaurantId: RESTAURANT_ID,
      ownerUserId: OWNER_ID,
      status: OrderStatus.COMPLETED,
    }),
    InvalidOrderStatusTransitionError,
  );
});

test("payment sync is idempotent, never downgrades paid or reopens cancellation", async () => {
  const orders = new MemoryOrderRepository();
  const order = await orders.createAtomic({
    customerUserId: CUSTOMER_ID,
    restaurantId: RESTAURANT_ID,
    currency: "VND",
    addressLabel: null,
    deliveryAddress: "123 Main Street",
    receiverName: "Customer One",
    receiverPhone: "0901234567",
    subtotal: "10.00",
    deliveryFee: "2.00",
    totalPrice: "12.00",
    items: [],
  });
  order.status = OrderStatus.CANCELLED;
  const handler = new SyncPaymentStatusCommandHandler(
    orders,
    new FakeRestaurantService(),
  );
  const paid = await handler.execute({
    orderId: order.id,
    method: PaymentMethod.MOCK_ONLINE,
    status: PaymentStatus.PAID,
  });
  const replayed = await handler.execute({
    orderId: order.id,
    method: PaymentMethod.MOCK_ONLINE,
    status: PaymentStatus.PAID,
  });
  assert.equal(paid.paymentStatus, PaymentStatus.PAID);
  assert.equal(paid.status, OrderStatus.CANCELLED);
  assert.equal(replayed.paymentStatus, PaymentStatus.PAID);

  await assert.rejects(
    handler.execute({
      orderId: order.id,
      method: PaymentMethod.MOCK_ONLINE,
      status: PaymentStatus.UNPAID,
    }),
    PaymentStatusConflictError,
  );
  await assert.rejects(
    handler.execute({
      orderId: order.id,
      method: PaymentMethod.COD,
      status: PaymentStatus.PAID,
    }),
    PaymentMethodConflictError,
  );
});

test("Prisma transaction rolls back order and notifications when outbox write fails", async () => {
  let committedOrders = 0;
  let committedNotifications = 0;
  let committedEvents = 0;
  const database = {
    $transaction: async (
      callback: (transaction: unknown) => Promise<unknown>,
    ) => {
      let stagedOrders = 0;
      let stagedNotifications = 0;
      let stagedEvents = 0;
      const now = new Date();
      const transaction = {
        order: {
          create: async (arguments_: {
            data: { items: { create: Array<Record<string, unknown>> } };
          }) => {
            stagedOrders += 1;
            assert.equal(arguments_.data.items.create.length, 2);
            return {
              id: ORDER_ID,
              customerUserId: CUSTOMER_ID,
              restaurantId: RESTAURANT_ID,
              status: OrderStatus.PENDING,
              paymentMethod: null,
              paymentStatus: PaymentStatus.UNPAID,
              currency: "VND",
              version: 1,
              addressLabel: null,
              deliveryAddress: "123 Main Street",
              receiverName: "Customer One",
              receiverPhone: "0901234567",
              subtotal: "20.00",
              deliveryFee: "2.00",
              totalPrice: "22.00",
              createdAt: now,
              updatedAt: now,
              items: arguments_.data.items.create.map((item, index) => ({
                ...item,
                id: randomUUID(),
                orderId: ORDER_ID,
                menuItemId: index === 0 ? ITEM_ONE_ID : ITEM_TWO_ID,
              })),
            };
          },
        },
        notification: {
          createMany: async (arguments_: { data: unknown[] }) => {
            stagedNotifications += arguments_.data.length;
            return { count: arguments_.data.length };
          },
        },
        orderEventOutbox: {
          create: async () => {
            stagedEvents += 1;
            throw new Error("outbox insert failed");
          },
        },
      };

      const result = await callback(transaction);
      committedOrders += stagedOrders;
      committedNotifications += stagedNotifications;
      committedEvents += stagedEvents;
      return result;
    },
  };
  const repository = new PrismaOrderRepository(
    database as unknown as PrismaClient,
  );

  await assert.rejects(
    repository.createAtomic(
      {
        customerUserId: CUSTOMER_ID,
        restaurantId: RESTAURANT_ID,
        currency: "VND",
        addressLabel: null,
        deliveryAddress: "123 Main Street",
        receiverName: "Customer One",
        receiverPhone: "0901234567",
        subtotal: "20.00",
        deliveryFee: "2.00",
        totalPrice: "22.00",
        items: [
          {
            menuItemId: ITEM_ONE_ID,
            name: "Rice",
            unitPrice: "10.00",
            quantity: 1,
            lineTotal: "10.00",
          },
          {
            menuItemId: ITEM_TWO_ID,
            name: "Soup",
            unitPrice: "10.00",
            quantity: 1,
            lineTotal: "10.00",
          },
        ],
      },
      {
        eventId: randomUUID(),
        type: OrderEventType.ORDER_CREATED,
        restaurantOwnerUserId: OWNER_ID,
        notifications: [
          {
            recipientUserId: CUSTOMER_ID,
            title: "Order placed",
            message: "Your order was created",
          },
        ],
      },
    ),
    /outbox insert failed/,
  );
  assert.equal(committedOrders, 0);
  assert.equal(committedNotifications, 0);
  assert.equal(committedEvents, 0);
});
