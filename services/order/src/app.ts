import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { IAuthService } from "./interface/auth-service.js";
import type { ICustomerService } from "./interface/customer-service.js";
import type { IOrderRepository } from "./interface/order-repository.js";
import type { IRestaurantService } from "./interface/restaurant-service.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { createInternalOrderRouter } from "./route/internal-order.route.js";
import {
  createCustomerOrderRouter,
  createRestaurantOrderRouter,
} from "./route/order.route.js";
import { AppError } from "./shared/app-error.js";
import { dataResponse, errorResponse } from "./shared/http-response.js";

export interface OrderAppDependencies {
  orders: IOrderRepository;
  authService: IAuthService;
  customerService: ICustomerService;
  restaurantService: IRestaurantService;
  deliveryFee: string;
  readiness: () => Promise<void>;
  frontendOrigin?: string;
  internalServiceKey: string;
}

export const createOrderApp = (dependencies: OrderAppDependencies) => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: dependencies.frontendOrigin ?? "http://localhost:5173",
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/internal/orders",
    createInternalOrderRouter(
      dependencies.orders,
      dependencies.internalServiceKey,
    ),
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/health", (_request, response) => {
    response.status(200).json(dataResponse({ service: "order", status: "ok" }));
  });
  app.get("/ready", async (_request, response) => {
    try {
      await dependencies.readiness();
      response
        .status(200)
        .json(dataResponse({ service: "order", status: "ready" }));
    } catch {
      response
        .status(503)
        .json(errorResponse("NOT_READY", "Order service is not ready"));
    }
  });

  app.use("/v1/orders", createCustomerOrderRouter(dependencies));
  app.use(
    "/v1/restaurants/:restaurantId/orders",
    createRestaurantOrderRouter(dependencies),
  );
  app.use((_request, _response, next) => {
    next(new AppError("ROUTE_NOT_FOUND", "Route not found", 404));
  });
  app.use(errorHandler);

  return app;
};
