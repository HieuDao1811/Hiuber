import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createOrderApp } from "./app.js";
import { prisma } from "./infras/database/prisma.js";
import { PrismaNotificationRepository } from "./infras/repository/prisma-notification.repository.js";
import { PrismaOrderEventRepository } from "./infras/repository/prisma-order-event.repository.js";
import { PrismaOrderRepository } from "./infras/repository/prisma-order.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { CustomerRpcClient } from "./infras/rpc/customer-rpc-client.js";
import { RestaurantRpcClient } from "./infras/rpc/restaurant-rpc-client.js";
import { registerSocketGateway } from "./realtime/socket-gateway.js";
import { SocketIoRealtimePublisher } from "./realtime/socket-io-publisher.js";
import { RealtimeSubscriptionAuthorizer } from "./realtime/subscription-authorizer.js";
import { DispatchOrderEventsCommandHandler } from "./usecase/dispatch-order-events.js";

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
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const internalServiceKey = requiredEnvironmentVariable("INTERNAL_SERVICE_KEY");
const orders = new PrismaOrderRepository(prisma);
const notifications = new PrismaNotificationRepository(prisma);
const authService = new AuthRpcClient(
  process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
  rpcTimeoutMs,
);
const restaurantService = new RestaurantRpcClient(
  process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3002",
  internalServiceKey,
  rpcTimeoutMs,
);

const app = createOrderApp({
  orders,
  notifications,
  authService,
  customerService: new CustomerRpcClient(
    process.env.CUSTOMER_SERVICE_URL ?? "http://localhost:3001",
    rpcTimeoutMs,
  ),
  restaurantService,
  deliveryFee: requiredEnvironmentVariable("DELIVERY_FEE"),
  orderCurrency: requiredEnvironmentVariable("ORDER_CURRENCY"),
  readiness: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  frontendOrigin,
  internalServiceKey,
});

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: frontendOrigin, credentials: true },
});
registerSocketGateway(
  io,
  authService,
  new RealtimeSubscriptionAuthorizer(orders, restaurantService),
  positiveIntegerEnvironmentVariable("SOCKET_AUTH_RECHECK_MS", 60_000),
);

const eventDispatcher = new DispatchOrderEventsCommandHandler(
  new PrismaOrderEventRepository(prisma),
  notifications,
  new SocketIoRealtimePublisher(io),
  positiveIntegerEnvironmentVariable("REALTIME_OUTBOX_RETRY_BASE_MS", 1_000),
);
let dispatchRunning = false;
const dispatchTimer = setInterval(async () => {
  if (dispatchRunning) return;
  dispatchRunning = true;
  try {
    await eventDispatcher.execute();
  } catch (error) {
    console.error("Realtime outbox dispatch failed", error);
  } finally {
    dispatchRunning = false;
  }
}, positiveIntegerEnvironmentVariable("REALTIME_OUTBOX_INTERVAL_MS", 250));
dispatchTimer.unref();

server.listen(port, () => {
  console.log(`Order service is running on port: ${port}`);
});
