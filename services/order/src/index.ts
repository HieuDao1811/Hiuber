import "dotenv/config";
import { createOrderApp } from "./app.js";
import { prisma } from "./infras/database/prisma.js";
import { PrismaOrderRepository } from "./infras/repository/prisma-order.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { CustomerRpcClient } from "./infras/rpc/customer-rpc-client.js";
import { RestaurantRpcClient } from "./infras/rpc/restaurant-rpc-client.js";

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

const positiveIntegerEnvironmentVariable = (
  name: string,
  fallback: number,
): number => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

const port = positiveIntegerEnvironmentVariable("PORT", 3003);
const rpcTimeoutMs = positiveIntegerEnvironmentVariable("RPC_TIMEOUT_MS", 5_000);

const app = createOrderApp({
  orders: new PrismaOrderRepository(prisma),
  authService: new AuthRpcClient(
    process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
    rpcTimeoutMs,
  ),
  customerService: new CustomerRpcClient(
    process.env.CUSTOMER_SERVICE_URL ?? "http://localhost:3001",
    rpcTimeoutMs,
  ),
  restaurantService: new RestaurantRpcClient(
    process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3002",
    rpcTimeoutMs,
  ),
  deliveryFee: requiredEnvironmentVariable("DELIVERY_FEE"),
  readiness: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  internalServiceKey: requiredEnvironmentVariable("INTERNAL_SERVICE_KEY"),
});

app.listen(port, () => {
  console.log(`Order service is running on port: ${port}`);
});
