import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { IAuthService } from "./interface/auth-service.js";
import type { IPaymentRepository } from "./interface/payment-repository.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { createPaymentRouter } from "./route/payment.route.js";
import { createProviderWebhookRouter } from "./route/provider-webhook.route.js";
import { AppError } from "./shared/app-error.js";
import { dataResponse, errorResponse } from "./shared/http-response.js";
import type { CreatePaymentCommandHandler } from "./usecase/create-payment.js";
import type { ProcessProviderWebhookCommandHandler } from "./usecase/process-provider-webhook.js";

export const createPaymentApp = (dependencies: {
  payments: IPaymentRepository;
  authService: IAuthService;
  createPayment: CreatePaymentCommandHandler;
  processProviderWebhook: ProcessProviderWebhookCommandHandler;
  readiness: () => Promise<void>;
  frontendOrigin?: string;
}) => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: dependencies.frontendOrigin ?? "http://localhost:5173" }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1_000, limit: 300 }));
  app.use(
    "/v1/payment-provider/webhooks",
    createProviderWebhookRouter(dependencies.processProviderWebhook),
  );
  app.use(express.json({ limit: "50kb" }));

  app.get("/health", (_request, response) => {
    response.status(200).json(dataResponse({ service: "payment", status: "ok" }));
  });
  app.get("/ready", async (_request, response) => {
    try {
      await dependencies.readiness();
      response.status(200).json(
        dataResponse({ service: "payment", status: "ready" }),
      );
    } catch {
      response.status(503).json(
        errorResponse("NOT_READY", "Payment service is not ready"),
      );
    }
  });

  app.use("/v1/payments", createPaymentRouter(dependencies));
  app.use((_request, _response, next) => {
    next(new AppError("ROUTE_NOT_FOUND", "Route not found", 404));
  });
  app.use(errorHandler);
  return app;
};
