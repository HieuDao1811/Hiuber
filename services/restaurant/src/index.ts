import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pathToFileURL } from "node:url";
import { PrismaMenuItemRepository } from "./infras/repository/prisma/menu-item.repository.js";
import { PrismaRestaurantRepository } from "./infras/repository/prisma/restaurant.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
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
      data: { service: "restaurant", status: "ok" },
    });
  });

  app.use("/v1/restaurants", createRestaurantRouter(dependencies));
  app.use(errorHandler);

  return app;
};

export const startRestaurantServer = (
  dependencies: RestaurantAppDependencies,
  port = Number(process.env.PORT ?? 3001),
) => {
  const app = createRestaurantApp(dependencies);
  return app.listen(port, () => {
    console.log(`Restaurant service is running on port ${port}`);
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startRestaurantServer({
    restaurantRepository: new PrismaRestaurantRepository(),
    menuItemRepository: new PrismaMenuItemRepository(),
    authService: new AuthRpcClient(
      process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
    ),
  });
}
