import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { IAuthService } from "./interface/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import {
  createRestaurantRouter,
  RestaurantRouterDependencies,
} from "./route/index.js";

export type RestaurantAppDependencies = RestaurantRouterDependencies;

export const createRestaurantApp = (
  dependencies: RestaurantAppDependencies,
) => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    }),
  );
  app.use(express.json());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/health", (_request, response) => {
    response.status(200).json({
      data: {
        service: "restaurant",
        status: "ok",
      },
    });
  });

  app.use("/restaurants", createRestaurantRouter(dependencies));
  app.use(errorHandler);

  return app;
};

export const createDefaultAuthService = (): IAuthService =>
  new AuthRpcClient(
    process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
  );

export const startRestaurantServer = (
  dependencies: RestaurantAppDependencies,
  port = Number(process.env.PORT ?? 3001),
) => {
  const app = createRestaurantApp(dependencies);
  return app.listen(port, () => {
    console.log(`Restaurant service is running on port ${port}`);
  });
};

// TODO: Instantiate the IRestaurantRepository adapter and pass it here with
// createDefaultAuthService(), then call startRestaurantServer().
