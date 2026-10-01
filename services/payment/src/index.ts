import "dotenv/config";
import { createPaymentApp } from "./app.js";
import { prisma } from "./infras/database/prisma.js";
import {
  MockPaymentProvider,
  type MockOutcome,
} from "./infras/provider/mock-payment-provider.js";
import { PrismaPaymentRepository } from "./infras/repository/prisma-payment.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { OrderRpcClient } from "./infras/rpc/order-rpc-client.js";
import { CreatePaymentCommandHandler } from "./usecase/create-payment.js";
import { OrderPaymentSynchronizer } from "./usecase/order-payment-synchronizer.js";
import { ProcessProviderWebhookCommandHandler } from "./usecase/process-provider-webhook.js";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};
const positiveInteger = (name: string, fallback: number): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};
const mockOutcome = (): MockOutcome => {
  const value = process.env.MOCK_ONLINE_OUTCOME ?? "SUCCESS";
  if (value !== "PENDING" && value !== "SUCCESS" && value !== "FAILURE") {
    throw new Error("MOCK_ONLINE_OUTCOME must be PENDING, SUCCESS or FAILURE");
  }
  return value;
};

if (process.env.PAYMENT_PROVIDER !== "MOCK") {
  throw new Error(
    "PAYMENT_PROVIDER must be MOCK until a production provider is configured",
  );
}
if (process.env.ENABLE_MOCK_PAYMENT_PROVIDER !== "true") {
  throw new Error(
    "ENABLE_MOCK_PAYMENT_PROVIDER=true is required for the mock provider",
  );
}
if (!new Set(["development", "test"]).has(process.env.NODE_ENV ?? "")) {
  throw new Error("The mock payment provider is restricted to development/test");
}

const rpcTimeoutMs = positiveInteger("RPC_TIMEOUT_MS", 5_000);
const payments = new PrismaPaymentRepository(prisma);
const orders = new OrderRpcClient(
  process.env.ORDER_SERVICE_URL ?? "http://localhost:3003",
  required("INTERNAL_SERVICE_KEY"),
  rpcTimeoutMs,
);
const synchronizer = new OrderPaymentSynchronizer(
  payments,
  orders,
  positiveInteger("ORDER_SYNC_RETRY_BASE_MS", 1_000),
);
const provider = new MockPaymentProvider(
  mockOutcome(),
  required("MOCK_PROVIDER_WEBHOOK_SECRET"),
);
const createPayment = new CreatePaymentCommandHandler(
  payments,
  orders,
  provider,
  synchronizer,
);

const app = createPaymentApp({
  payments,
  createPayment,
  processProviderWebhook: new ProcessProviderWebhookCommandHandler(
    payments,
    provider,
    synchronizer,
  ),
  authService: new AuthRpcClient(
    process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
    rpcTimeoutMs,
  ),
  readiness: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN,
});

let reconciliationRunning = false;
const reconciliationTimer = setInterval(async () => {
  if (reconciliationRunning) return;
  reconciliationRunning = true;
  try {
    await synchronizer.reconcile();
  } catch (error) {
    console.error("Payment reconciliation failed", error);
  } finally {
    reconciliationRunning = false;
  }
}, positiveInteger("ORDER_SYNC_INTERVAL_MS", 5_000));
reconciliationTimer.unref();

app.listen(positiveInteger("PORT", 3004), () => {
  console.log(`Payment service is running on port: ${process.env.PORT ?? 3004}`);
});
