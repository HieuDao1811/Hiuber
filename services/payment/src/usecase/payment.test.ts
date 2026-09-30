import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { IOrderService, PaymentOrderContext } from "../interface/order-service.js";
import type { IPaymentProvider, ProviderResult } from "../interface/payment-provider.js";
import type {
  ClaimPaymentData,
  IPaymentRepository,
  ProviderEventData,
} from "../interface/payment-repository.js";
import {
  MockPaymentProvider,
  signMockWebhook,
} from "../infras/provider/mock-payment-provider.js";
import { CreatePaymentSchema } from "../model/payment.dto.js";
import type { Payment } from "../model/payment.js";
import {
  ForbiddenError,
  IdempotencyConflictError,
  InvalidProviderEventError,
  InvalidProviderSignatureError,
  PaymentAlreadyExistsError,
  PaymentNotFoundError,
} from "../model/errors.js";
import {
  OrderPaymentStatus,
  OrderStatus,
  OrderSyncStatus,
  PaymentMethod,
  PaymentResolutionStatus,
  PaymentStatus,
} from "../share/enums/index.js";
import { CreatePaymentCommandHandler } from "./create-payment.js";
import { OrderPaymentSynchronizer } from "./order-payment-synchronizer.js";
import { GetPaymentQueryHandler } from "./get-payment.js";
import { ProcessProviderWebhookCommandHandler } from "./process-provider-webhook.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const ORDER_ID = "33333333-3333-4333-8333-333333333333";
const MOCK_WEBHOOK_SECRET = "test-mock-webhook-secret-at-least-32-chars";

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
      resolutionStatus: PaymentResolutionStatus.NONE,
      resolutionReason: null,
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

  async markProcessing(id: string, providerTransactionId: string) {
    const payment = this.get(id);
    payment.providerTransactionId = providerTransactionId;
    return payment;
  }

  async markFailed(
    id: string,
    providerTransactionId: string,
    failureCode: string,
  ) {
    const payment = this.get(id);
    payment.status = PaymentStatus.FAILED;
    payment.providerTransactionId = providerTransactionId;
    payment.failureCode = failureCode;
    return payment;
  }

  private readonly providerEventIds = new Set<string>();

  async applyProviderEvent(event: ProviderEventData) {
    const payment = this.get(event.paymentId);
    if (
      payment.orderId !== event.orderId ||
      payment.providerTransactionId !== event.providerTransactionId ||
      payment.amount !== event.amount ||
      payment.currency !== event.currency ||
      payment.method !== PaymentMethod.MOCK_ONLINE
    ) {
      throw new InvalidProviderEventError(
        "Provider event does not match the payment",
      );
    }
    const key = `${event.provider}:${event.providerEventId}`;
    if (this.providerEventIds.has(key) || payment.status === event.status) {
      return { payment, duplicate: true };
    }
    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new InvalidProviderEventError(
        "Provider event conflicts with the terminal payment status",
      );
    }
    this.providerEventIds.add(key);
    payment.status = event.status;
    payment.failureCode = event.failureCode;
    if (event.status === PaymentStatus.SUCCEEDED) {
      payment.orderSyncStatus = OrderSyncStatus.PENDING;
      payment.nextOrderSyncAt = new Date();
    }
    return { payment, duplicate: false };
  }

  async markOrderSynced(id: string, refundRequired = false) {
    const payment = this.get(id);
    payment.orderSyncStatus = OrderSyncStatus.SYNCED;
    payment.orderSyncedAt = new Date();
    payment.nextOrderSyncAt = null;
    if (refundRequired) {
      payment.resolutionStatus = PaymentResolutionStatus.REFUND_REQUIRED;
      payment.resolutionReason = "ORDER_CANCELLED_AFTER_PAYMENT";
    }
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
    currency: "VND",
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
    return { orderStatus: this.context.status };
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
      status: "SUCCEEDED" as const,
      providerTransactionId: `mock_${this.calls}`,
    };
  }

  verifyWebhook(): never {
    throw new Error("not implemented by fake provider");
  }
}

const setup = (
  orders = new FakeOrderService(),
  provider = new FakeProvider([
    { status: "SUCCEEDED", providerTransactionId: "mock_success" },
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
    currency: "USD",
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
  assert.equal(first.payment.currency, "VND");
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
    { status: "SUCCEEDED", providerTransactionId: "mock_concurrent" },
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
    { status: "SUCCEEDED", providerTransactionId: "mock_single_charge" },
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
    {
      status: "FAILED",
      providerTransactionId: "mock_failed",
      failureCode: "MOCK_PAYMENT_DECLINED",
    },
    { status: "SUCCEEDED", providerTransactionId: "mock_retry" },
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

const webhookFixture = () => {
  const payments = new MemoryPaymentRepository();
  const orders = new FakeOrderService();
  const provider = new MockPaymentProvider("PENDING", MOCK_WEBHOOK_SECRET);
  const synchronizer = new OrderPaymentSynchronizer(payments, orders, 1);
  return {
    payments,
    orders,
    createPayment: new CreatePaymentCommandHandler(
      payments,
      orders,
      provider,
      synchronizer,
    ),
    processWebhook: new ProcessProviderWebhookCommandHandler(
      payments,
      provider,
      synchronizer,
    ),
  };
};

const mockWebhookBody = (
  payment: Payment,
  overrides: Record<string, unknown> = {},
) =>
  Buffer.from(
    JSON.stringify({
      id: "evt_mock_success_1",
      type: "payment.succeeded",
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        providerTransactionId: payment.providerTransactionId,
        amount: payment.amount,
        currency: payment.currency,
        ...overrides,
      },
    }),
  );

test("signed webhook succeeds once and duplicate delivery is idempotent", async () => {
  const fixture = webhookFixture();
  const created = await fixture.createPayment.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "webhook-success-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  assert.equal(created.payment.status, PaymentStatus.PROCESSING);
  const stored = fixture.payments.records[0]!;
  const body = mockWebhookBody(stored);
  const signature = signMockWebhook(body, MOCK_WEBHOOK_SECRET);

  const first = await fixture.processWebhook.execute(body, signature);
  const duplicate = await fixture.processWebhook.execute(body, signature);

  assert.equal(first.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(first.payment.orderSyncStatus, OrderSyncStatus.SYNCED);
  assert.equal(duplicate.duplicate, true);
  assert.equal(fixture.orders.syncCalls, 1);
  assert.equal(fixture.orders.context.paymentStatus, OrderPaymentStatus.PAID);
});

test("forged or mismatched webhook cannot change payment state", async () => {
  const fixture = webhookFixture();
  await fixture.createPayment.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "webhook-validation-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  const stored = fixture.payments.records[0]!;
  const validBody = mockWebhookBody(stored);
  await assert.rejects(
    fixture.processWebhook.execute(validBody, "sha256=forged"),
    InvalidProviderSignatureError,
  );

  const wrongAmountBody = mockWebhookBody(stored, { amount: "1.00" });
  await assert.rejects(
    fixture.processWebhook.execute(
      wrongAmountBody,
      signMockWebhook(wrongAmountBody, MOCK_WEBHOOK_SECRET),
    ),
    InvalidProviderEventError,
  );
  assert.equal(stored.status, PaymentStatus.PROCESSING);
  assert.equal(fixture.orders.syncCalls, 0);
});

test("successful callback after cancellation stays paid and requires refund", async () => {
  const fixture = webhookFixture();
  await fixture.createPayment.execute({
    customerId: CUSTOMER_ID,
    idempotencyKey: "late-callback-key",
    input: { orderId: ORDER_ID, method: PaymentMethod.MOCK_ONLINE },
  });
  fixture.orders.context.status = OrderStatus.CANCELLED;
  const stored = fixture.payments.records[0]!;
  const body = mockWebhookBody(stored, {});

  const result = await fixture.processWebhook.execute(
    body,
    signMockWebhook(body, MOCK_WEBHOOK_SECRET),
  );

  assert.equal(result.payment.status, PaymentStatus.SUCCEEDED);
  assert.equal(
    result.payment.resolutionStatus,
    PaymentResolutionStatus.REFUND_REQUIRED,
  );
  assert.equal(fixture.orders.context.status, OrderStatus.CANCELLED);
  assert.equal(fixture.orders.context.paymentStatus, OrderPaymentStatus.PAID);
});
