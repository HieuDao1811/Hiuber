import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { IAuthService } from "./interface/auth-service.js";
import type { ICustomerAddressRepository } from "./interface/repository/customer-address.repository.js";
import type { ICustomerProfileRepository } from "./interface/repository/customer-profile.repository.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { createCustomerRouter } from "./route/customer.route.js";
import { AppError } from "./shared/app-error.js";
import { dataResponse } from "./shared/http-response.js";

export interface CustomerAppDependencies {
  profiles: ICustomerProfileRepository;
  addresses: ICustomerAddressRepository;
  authService: IAuthService;
  frontendOrigin?: string;
}

export const createCustomerApp = (dependencies: CustomerAppDependencies) => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: dependencies.frontendOrigin ?? "http://localhost:5173",
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/health", (_request, response) => {
    response
      .status(200)
      .json(dataResponse({ service: "customer", status: "ok" }));
  });

  app.use("/v1/customers", createCustomerRouter(dependencies));
  app.use((_request, _response, next) => {
    next(new AppError("ROUTE_NOT_FOUND", "Route not found", 404));
  });
  app.use(errorHandler);

  return app;
};
