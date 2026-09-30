import { Router } from "express";
import { InternalOrderHttpService } from "../infras/transport/internal-order-http-service.js";
import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import { authenticateInternalService } from "../middleware/internal-auth.middleware.js";
import { GetPaymentContextQueryHandler } from "../usecase/get-payment-context.js";
import { SyncPaymentStatusCommandHandler } from "../usecase/sync-payment-status.js";

export const createInternalOrderRouter = (
  orders: IOrderRepository,
  restaurants: IRestaurantService,
  internalServiceKey: string,
) => {
  const router = Router();
  const http = new InternalOrderHttpService(
    new GetPaymentContextQueryHandler(orders),
    new SyncPaymentStatusCommandHandler(orders, restaurants),
  );

  router.use(authenticateInternalService(internalServiceKey));
  router.get("/:orderId/payment-context", http.getContext.bind(http));
  router.put("/:orderId/payment", http.syncPayment.bind(http));
  return router;
};
