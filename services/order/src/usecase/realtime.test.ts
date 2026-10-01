import assert from "node:assert/strict";
import test from "node:test";
import type { IAuthService } from "../interface/auth-service.js";
import type { INotificationRepository } from "../interface/notification-repository.js";
import type { IOrderEventRepository } from "../interface/order-event-repository.js";
import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRealtimePublisher } from "../interface/realtime-publisher.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import { NotificationNotFoundError, ForbiddenError } from "../model/errors.js";
import type { Notification } from "../model/notification.js";
import type { StoredOrderEvent } from "../model/order-event.js";
import type { Order } from "../model/order.js";
import { authenticateSocketToken } from "../realtime/socket-gateway.js";
import { RealtimeSubscriptionAuthorizer } from "../realtime/subscription-authorizer.js";
import {
  OrderEventType,
  OrderStatus,
  PaymentStatus,
  RestaurantStatus,
  UserRole,
} from "../share/enums/index.js";
import { DispatchOrderEventsCommandHandler } from "./dispatch-order-events.js";
import { ListNotificationsQueryHandler } from "./list-notifications.js";
import { MarkNotificationReadCommandHandler } from "./mark-notification-read.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const OWNER_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_OWNER_ID = "44444444-4444-4444-8444-444444444444";
const RESTAURANT_ID = "55555555-5555-4555-8555-555555555555";
const ORDER_ID = "66666666-6666-4666-8666-666666666666";
const EVENT_ID = "77777777-7777-4777-8777-777777777777";
const NOTIFICATION_ID = "88888888-8888-4888-8888-888888888888";

const order: Order = {
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
  subtotal: "10.00",
  deliveryFee: "2.00",
  totalPrice: "12.00",
  createdAt: new Date("2026-09-30T00:00:00.000Z"),
  updatedAt: new Date("2026-09-30T00:00:00.000Z"),
  items: [],
};

const orders = {
  findById: async (orderId: string) => (orderId === ORDER_ID ? order : null),
  findByIdForCustomer: async (orderId: string, customerUserId: string) =>
    orderId === ORDER_ID && customerUserId === CUSTOMER_ID ? order : null,
} as unknown as IOrderRepository;

const restaurants: IRestaurantService = {
  getOrderContext: async (restaurantId) => ({
    restaurant: {
      id: restaurantId,
      ownerUserId: OWNER_ID,
      status: RestaurantStatus.OPEN,
    },
    menuItems: [],
  }),
};

test("socket authentication rejects missing or invalid access tokens", async () => {
  const auth: IAuthService = {
    verifyAccessToken: async (accessToken) => {
      if (accessToken !== "valid-token") throw new Error("invalid token");
      return { userId: CUSTOMER_ID, role: UserRole.CUSTOMER };
    },
  };

  await assert.rejects(authenticateSocketToken(auth, undefined), /UNAUTHENTICATED/);
  await assert.rejects(authenticateSocketToken(auth, "forged-token"), /invalid token/);
  const data = await authenticateSocketToken(auth, "valid-token");
  assert.deepEqual(data.requester, {
    userId: CUSTOMER_ID,
    role: UserRole.CUSTOMER,
  });
});

test("realtime subscriptions enforce customer and restaurant ownership", async () => {
  const authorizer = new RealtimeSubscriptionAuthorizer(orders, restaurants);

  await assert.rejects(
    authorizer.authorizeOrder(
      { userId: OTHER_CUSTOMER_ID, role: UserRole.CUSTOMER },
      ORDER_ID,
    ),
    ForbiddenError,
  );
  await assert.rejects(
    authorizer.authorizeOrder(
      { userId: OTHER_OWNER_ID, role: UserRole.RESTAURANT },
      ORDER_ID,
    ),
    ForbiddenError,
  );
  await assert.rejects(
    authorizer.authorizeRestaurant(
      { userId: OTHER_OWNER_ID, role: UserRole.RESTAURANT },
      RESTAURANT_ID,
    ),
    ForbiddenError,
  );

  await authorizer.authorizeOrder(
    { userId: CUSTOMER_ID, role: UserRole.CUSTOMER },
    ORDER_ID,
  );
  await authorizer.authorizeRestaurant(
    { userId: OWNER_ID, role: UserRole.RESTAURANT },
    RESTAURANT_ID,
  );
});

class MemoryNotifications implements INotificationRepository {
  constructor(readonly records: Notification[]) {}

  async findPage(recipientUserId: string, query: { limit: number }) {
    return {
      items: this.records
        .filter((item) => item.recipientUserId === recipientUserId)
        .slice(0, query.limit),
      nextCursor: null,
    };
  }

  async countUnread(recipientUserId: string) {
    return this.records.filter(
      (item) => item.recipientUserId === recipientUserId && !item.readAt,
    ).length;
  }

  async markRead(id: string, recipientUserId: string, readAt: Date) {
    const item = this.records.find(
      (notification) =>
        notification.id === id &&
        notification.recipientUserId === recipientUserId,
    );
    if (!item) return null;
    item.readAt ??= readAt;
    return item;
  }

  async markAllRead(recipientUserId: string, readAt: Date) {
    let updated = 0;
    for (const item of this.records) {
      if (item.recipientUserId === recipientUserId && !item.readAt) {
        item.readAt = readAt;
        updated += 1;
      }
    }
    return updated;
  }

  async findBySourceEvent(sourceEventId: string) {
    return this.records.filter((item) => item.sourceEventId === sourceEventId);
  }
}

const notification = (): Notification => ({
  id: NOTIFICATION_ID,
  recipientUserId: CUSTOMER_ID,
  type: OrderEventType.ORDER_CREATED,
  title: "Order created",
  message: "Your order was created",
  orderId: ORDER_ID,
  sourceEventId: EVENT_ID,
  orderVersion: 1,
  readAt: null,
  createdAt: new Date("2026-09-30T00:00:00.000Z"),
});

test("persisted notifications remain available offline and are ownership scoped", async () => {
  const repository = new MemoryNotifications([notification()]);
  const list = new ListNotificationsQueryHandler(repository);
  const markRead = new MarkNotificationReadCommandHandler(repository);

  assert.equal((await list.query(CUSTOMER_ID, { limit: 10 })).items.length, 1);
  assert.equal(
    (await list.query(OTHER_CUSTOMER_ID, { limit: 10 })).items.length,
    0,
  );
  await assert.rejects(
    markRead.execute(NOTIFICATION_ID, OTHER_CUSTOMER_ID),
    NotificationNotFoundError,
  );
  assert.ok((await markRead.execute(NOTIFICATION_ID, CUSTOMER_ID)).readAt);
});

test("a dispatched outbox event is not emitted or materialized twice", async () => {
  const storedEvent: StoredOrderEvent = {
    eventId: EVENT_ID,
    type: OrderEventType.ORDER_CREATED,
    orderId: ORDER_ID,
    orderVersion: 1,
    orderStatus: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: null,
    customerUserId: CUSTOMER_ID,
    restaurantOwnerUserId: OWNER_ID,
    restaurantId: RESTAURANT_ID,
    occurredAt: new Date("2026-09-30T00:00:00.000Z"),
    attempts: 0,
  };
  let dispatched = false;
  const eventRepository: IOrderEventRepository = {
    findDue: async () => (dispatched ? [] : [storedEvent]),
    markDispatched: async () => {
      dispatched = true;
    },
    recordFailure: async () => undefined,
  };
  const notifications = new MemoryNotifications([notification()]);
  let publishCount = 0;
  const publisher: IRealtimePublisher = {
    publish: (_event, materializedNotifications) => {
      publishCount += 1;
      assert.equal(materializedNotifications.length, 1);
    },
  };
  const handler = new DispatchOrderEventsCommandHandler(
    eventRepository,
    notifications,
    publisher,
  );

  await handler.execute();
  await handler.execute();

  assert.equal(publishCount, 1);
  assert.equal(notifications.records.length, 1);
});
