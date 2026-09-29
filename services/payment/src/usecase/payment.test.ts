import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { IOrderService, PaymentOrderContext } from "../interface/order-service.js";
import type { IPaymentProvider, ProviderResult } from "../interface/payment-provider.js";
import type {
  ClaimPaymentData,
  IPaymentRepository,
} from "../interface/payment-repository.js";
import { CreatePaymentSchema } from "../model/payment.dto.js";
import type { Payment } from "../model/payment.js";
import {
  ForbiddenError,
  IdempotencyConflictError,
  PaymentAlreadyExistsError,
  PaymentNotFoundError,
} from "../model/errors.js";
import {
  OrderPaymentStatus,
  OrderStatus,
  OrderSyncStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";
import { CreatePaymentCommandHandler } from "./create-payment.js";
import { OrderPaymentSynchronizer } from "./order-payment-synchronizer.js";
import { GetPaymentQueryHandler } from "./get-payment.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";

class MemoryPaymentRepository implements IPaymentRepository {
  readonly records: Payment[] = [];

  async findByIdempotencyKey(customerId: string, idempotencyKey: string) {
    return this.records.find(
      (payment) =>
        payment.customerId === customerId &&
        payment.idempotencyKey === idempotencyKey,
    ) ?? null;
  }

  async claim(data: ClaimPaymentData) {
    const duplicate = await this.findByIdempotencyKey(
      data.customerId,
      data.idempotencyKey,
    );
    if (duplicate) return { kind: "EXISTING" as const, payment: duplicate };
    const active = this.records.some(
      (payment) =>
        payment.orderId === data.orderId &&
        [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED]
          .includes(payment.status),
    );
    if (active) return { kind: "ORDER_CONFLICT" as const };

    const now = new Date();
    const payment: Payment = {
      id: randomUUID(),
      ...data,
      providerTransactionId: null,
      failureCode: null,
      orderSyncStatus:
        data.status === PaymentStatus.PENDING
          ? OrderSyncStatus.PENDING
          : OrderSyncStatus.NOT_REQUIRED,
      orderSyncAttempts: 0,
      nextOrderSyncAt: data.status === PaymentStatus.PENDING ? now : null,
      orderSyncedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(payment);
    return { kind: "CLAIMED" as const, payment };
  }

  async findByIdForCustomer(id: string, customerId: string) {
    return this.records.find(
      (payment) => payment.id === id && payment.customerId === customerId,
    ) ?? null;
  }

  async markSucceeded(id: string, providerTransactionId: string) {
    const payment = this.get(id);
    payment.status = PaymentStatus.SUCCEEDED;
    payment.providerTransactionId = providerTransactionId;
    payment.orderSyncStatus = OrderSyncStatus.PENDING;
    payment.nextOrderSyncAt = new Date();
    return payment;
  }

  async markFailed(id: string, failureCode: string) {
    const payment = this.get(id);
    payment.status = PaymentStatus.FAILED;
    payment.failureCode = failureCode;
    return payment;
  }

  async markOrderSynced(id: string) {
    const payment = this.get(id);
    payment.orderSyncStatus = OrderSyncStatus.SYNCED;
    payment.orderSyncedAt = new Date();
    payment.nextOrderSyncAt = null;
    return payment;
  }

  async recordOrderSyncFailure(id: string, nextAttemptAt: Date) {
    const payment = this.get(id);
    payment.orderSyncStatus = OrderSyncStatus.PENDING;
    payment.orderSyncAttempts += 1;
    payment.nextOrderSyncAt = nextAttemptAt;
    return payment;
  }

  async findDueOrderSync(now: Date, limit: number) {
    return this.records.filter(
      (payment) =>
        payment.orderSyncStatus === OrderSyncStatus.PENDING &&
        payment.nextOrderSyncAt !== null &&
        payment.nextOrderSyncAt <= now,
    ).slice(0, limit);
  }

  private get(id: string): Payment {
    const payment = this.records.find((candidate) => candidate.id === id);
    if (!payment) throw new Error("payment not found");
    payment.updatedAt = new Date();
    return payment;
  }
}

class FakeOrderService implements IOrderService {
  syncCalls = 0;
  failSyncTimes = 0;

  constructor(public context: PaymentOrderContext = {
    id: ORDER_ID,
    customerUserId: CUSTOMER_ID,
    status: OrderStatus.PENDING,
    totalPrice: "125000.00",
    paymentMethod: null,
    paymentStatus: OrderPaymentStatus.UNPAID,
  }) {}

  async getPaymentContext() { return this.context; }

  async syncPayment(
    _orderId: string,
    method: PaymentMethod,
    status: OrderPaymentStatus,
  ) {
    this.syncCalls += 1;
    if (this.failSyncTimes > 0) {
      this.failSyncTimes -= 1;
      throw new Error("temporary order outage");
    }
    this.context.paymentMethod = method;
    this.context.paymentStatus = status;
  }
}

class FakeProvider implements IPaymentProvider {
  calls = 0;
  constructor(
    private readonly outcomes: ProviderResult[],
    private readonly wait?: Promise<void>,
  ) {}

  async charge() {
    this.calls += 1;
    if (this.wait) await this.wait;
    return this.outcomes.shift() ?? {
      succeeded: true as const,
      providerTransactionId: `mock_${this.calls}`,
    };
  }
}

const setup = (
  orders = new FakeOrderService(),
  provider = new FakeProvider([
    { succeeded: true, providerTransactionId: "mock_success" },
  ]),
  now: () => Date = () => new Date(),
) => {
  const payments = new MemoryPaymentRepository();
  const synchronizer = new OrderPaymentSynchronizer(payments, orders, 1, now);
  return {
    payments,
    orders,
    provider,
    synchronizer,
    handler: new CreatePaymentCommandHandler(
      payments,
      orders,
      provider,
      synchronizer,
    ),
  };
};

test("request schema rejects client-owned amount, customerId and paymentStatus", () => {
  assert.throws(() => CreatePaymentSchema.parse({
    orderId: ORDER_ID,
    method: PaymentMethod.MOCK_ONLINE,
    amount: "1.00",
    customerId: OTHER_CUSTOMER_ID,
    paymentStatus: PaymentStatus.SUCCEEDED,
  }));
});

test("customer cannot pay an order owned by another customer", async () => {
  const orders = new FakeOrderService();
  orders.context.customerUserId = OTHER_CUSTOMER_ID;
  const { handler, payments } = setup(orders);
  await assert.rejects(
    handler.execute({
      customerId: CUSTOMER_ID,
      idempotencyKey: "ownership-test-key",
      input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
    }),
    ForbiddenError,
  );
  assert.equal(payments.records.length, 0);
});

test("amount always comes from Order and an idempotent replay does not charge twice", async () => {
  const context = new FakeOrderService();
  context.context.totalPrice = "90001.50";
  const fixture = setup(context);
  const command = {
    customerId: CUSTOMER_ID,
    idempotencyKey: "same-intent-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  };
  const first = await fixture.handler.execute(command);
  const second = await fixture.handler.execute(command);

  assert.equal(first.payment.amount, "90001.50");
  assert.equal(first.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(second.payment.id, first.payment.id);
  assert.equal(second.replayed, true);
  assert.equal(fixture.provider.calls, 1);
});

test("same idempotency key with different content is rejected", async () => {
  const fixture = setup();
  await fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "conflicting-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.COD },
  });
  await assert.rejects(
    fixture.handler.execute({
      customerId: CUSTOMER_ID,
      idempotencyKey: "conflicting-key",
      input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
    }),
    IdempotencyConflictError,
  );
});

test("two concurrent requests with one key execute the provider once", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const provider = new FakeProvider([
    { succeeded: true, providerTransactionId: "mock_concurrent" },
  ], gate);
  const fixture = setup(new FakeOrderService(), provider);
  const command = {
    customerId: CUSTOMER_ID,
    idempotencyKey: "concurrent-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  };

  const firstPromise = fixture.handler.execute(command);
  while (provider.calls === 0) await new Promise((resolve) => setImmediate(resolve));
  const second = await fixture.handler.execute(command);
  assert.equal(second.inFlight, true);
  assert.equal(second.payment.status, PaymentStatus.PROCESSING);
  release();
  const first = await firstPromise;
  assert.equal(first.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(provider.calls, 1);
  assert.equal(fixture.payments.records.length, 1);
});

test("two concurrent intents for one order cannot both reach the provider", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const provider = new FakeProvider([
    { succeeded: true, providerTransactionId: "mock_single_charge" },
  ], gate);
  const fixture = setup(new FakeOrderService(), provider);
  const firstPromise = fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "concurrent-intent-one",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  while (provider.calls === 0) await new Promise((resolve) => setImmediate(resolve));

  await assert.rejects(
    fixture.handler.execute({
      customerId: CUSTOMER_ID,
      idempotencyKey: "concurrent-intent-two",
      input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
    }),
    PaymentAlreadyExistsError,
  );
  release();
  await firstPromise;
  assert.equal(provider.calls, 1);
  assert.equal(fixture.payments.records.length, 1);
});

test("failed online payment releases the order for retry with a new key", async () => {
  const provider = new FakeProvider([
    { succeeded: false, failureCode: "MOCK_PAYMENT_DECLINED" },
    { succeeded: true, providerTransactionId: "mock_retry" },
  ]);
  const fixture = setup(new FakeOrderService(), provider);
  const failed = await fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "failed-attempt",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  const retried = await fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "retry-attempt",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  assert.equal(failed.payment.status, PaymentStatus.FAILED);
  assert.equal(retried.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(provider.calls, 2);
});

test("successful payment is retained and Order synchronization is retried", async () => {
  let currentTime = new Date("2026-09-29T00:00:00.000Z");
  const orders = new FakeOrderService();
  orders.failSyncTimes = 1;
  const fixture = setup(orders, undefined, () => currentTime);
  const result = await fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "sync-retry-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  assert.equal(result.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(result.payment.orderSyncStatus, OrderSyncStatus.PENDING);
  assert.equal(result.payment.orderSyncAttempts, 1);

  currentTime = new Date(currentTime.getTime() + 2);
  assert.equal(await fixture.synchronizer.reconcile(), 1);
  assert.equal(
    fixture.payments.records[0]?.orderSyncStatus,
    OrderSyncStatus.SYNCED,
  );
  assert.equal(orders.context.paymentStatus, OrderPaymentStatus.PAID);
});

test("payment lookup only returns records owned by the customer", async () => {
  const fixture = setup();
  const created = await fixture.handler.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "owned-payment-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.COD },
  });
  const query = new GetPaymentQueryHandler(fixture.payments);
  assert.equal(
    (await query.query(created.payment.id, CUSTOMER_ID)).id,
    created.payment.id,
  );
  await assert.rejects(
    query.query(created.payment.id, OTHER_CUSTOMER_ID),
    PaymentNotFoundError,
  );
});
