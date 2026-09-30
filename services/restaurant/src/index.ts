import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { PrismaMenuItemRepository } from "./infras/repository/prisma/menu-item.repository.js";
import { PrismaRestaurantRepository } from "./infras/repository/prisma/restaurant.repository.js";
import { AuthRpcClient } from "./infras/rpc/auth-rpc-client.js";
import { uploadImage } from "./infras/storage/cloudinary.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { createRestaurantRouter } from "./route/index.js";
import { createInternalRestaurantRouter } from "./route/internal.js";

const app = express();
const port = Number(process.env.PORT ?? 3002);
const internalServiceKey = process.env.INTERNAL_SERVICE_KEY;
if (!internalServiceKey) throw new Error("INTERNAL_SERVICE_KEY is not configured");
const restaurantRepository = new PrismaRestaurantRepository();
const menuItemRepository = new PrismaMenuItemRepository();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  }),
);
app.use(express.json());
app.use(
  "/internal",
  createInternalRestaurantRouter({
    restaurantRepository,
    menuItemRepository,
    internalServiceKey,
  }),
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    data: { service: "restaurant", status: "ok" },
  });
});

app.use(
  "/v1/restaurants",
  createRestaurantRouter({
    restaurantRepository,
    menuItemRepository,
    authService: new AuthRpcClient(
      process.env.AUTH_SERVICE_URL ?? "http://localhost:3000",
    ),
    uploadImage,
  }),
);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Restaurant service is running on port: ${port}`);
});
