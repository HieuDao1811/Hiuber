import { Router } from "express";
import { InternalRestaurantHttpService } from "../infras/transport/internal-restaurant-http-service.js";
import type {
  IMenuItemRepository,
  IRestaurantRepository,
} from "../interface/index.js";
import { GetOrderContextQueryHandler } from "../usecase/get-order-context.js";
import { authenticateInternalService } from "../middlewares/internal-auth.middleware.js";

export interface InternalRestaurantRouterDependencies {
  restaurantRepository: IRestaurantRepository;
  menuItemRepository: IMenuItemRepository;
  internalServiceKey: string;
}

export const createInternalRestaurantRouter = (
  dependencies: InternalRestaurantRouterDependencies,
) => {
  const query = new GetOrderContextQueryHandler(
    dependencies.restaurantRepository,
    dependencies.menuItemRepository,
  );
  const httpService = new InternalRestaurantHttpService(query);
  const router = Router();

  router.use(authenticateInternalService(dependencies.internalServiceKey));

  router.post(
    "/restaurants/order-context",
    httpService.getOrderContext.bind(httpService),
  );

  return router;
};
