import "dotenv/config";
import { createPaymentApp } from "./app.js";
import { prisma } from "./infras/database/prisma.js";
import { MockPaymentProvider, type MockOutcome } from "./infras/provider/mock-payment-provider.js";
import { PrismaPaymentRepository } from "./infras/repository/prisma-payment.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { OrderRpcClient } from "./infras/rpc/order-rpc-client.js";
import { CreatePaymentCommandHandler } from "./usecase/create-payment.js";
import { OrderPaymentSynchronizer } from "./usecase/order-payment-synchronizer.js";

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
  if (value !== "SUCCESS" && value !== "FAILURE") {
    throw new Error("MOCK_ONLINE_OUTCOME must be SUCCESS or FAILURE");
  }
  return value;
};

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
const createPayment = new CreatePaymentCommandHandler(
  payments,
  orders,
  new MockPaymentProvider(mockOutcome()),
  synchronizer,
);

const app = createPaymentApp({
  payments,
  createPayment,
  authService: new AuthRpcClient(
    process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
    rpcTimeoutMs,
  ),
  readiness: async () => { await prisma.$queryRaw`SELECT 1`; },
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
