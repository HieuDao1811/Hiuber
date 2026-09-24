import { Router } from "express";
import { RestaurantHttpService } from "../infras/transport/restaurant-http-service.js";
import {
  IAuthService,
  IMenuItemRepository,
  IRestaurantRepository,
} from "../interface/index.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { UserRole } from "../share/enums/index.js";
import { CreateMenuItemCommandHandler } from "../usecase/create-menu-item.js";
import { CreateRestaurantCommandHandler } from "../usecase/create-restaurant.js";
import { GetRestaurantQueryHandler } from "../usecase/get-restaurant.js";
import { ListMenuItemsQueryHandler } from "../usecase/list-menu-items.js";
import { ListRestaurantsQueryHandler } from "../usecase/list-restaurants.js";
import { UpdateMenuItemCommandHandler } from "../usecase/update-menu-item.js";
import { UpdateRestaurantCommandHandler } from "../usecase/update-restaurant.js";

export type RestaurantRouterDependencies = {
  restaurantRepository: IRestaurantRepository;
  menuItemRepository: IMenuItemRepository;
  authService: IAuthService;
};

export const createRestaurantRouter = (
  dependencies: RestaurantRouterDependencies,
) => {
  const httpService = new RestaurantHttpService(
    new CreateRestaurantCommandHandler(dependencies.restaurantRepository),
    new ListRestaurantsQueryHandler(dependencies.restaurantRepository),
    new GetRestaurantQueryHandler(dependencies.restaurantRepository),
    new UpdateRestaurantCommandHandler(dependencies.restaurantRepository),
    new CreateMenuItemCommandHandler(
      dependencies.restaurantRepository,
      dependencies.menuItemRepository,
    ),
    new ListMenuItemsQueryHandler(
      dependencies.restaurantRepository,
      dependencies.menuItemRepository,
    ),
    new UpdateMenuItemCommandHandler(
      dependencies.restaurantRepository,
      dependencies.menuItemRepository,
    ),
  );
  const authenticateRequest = authenticate(dependencies.authService);
  const restaurantOwnerOnly = authorize(UserRole.RESTAURANT);
  const router = Router();

  router.post(
    "/",
    authenticateRequest,
    restaurantOwnerOnly,
    httpService.create.bind(httpService),
  );
  router.get("/", httpService.list.bind(httpService));
  router.get("/:restaurantId", httpService.getById.bind(httpService));
  router.patch(
    "/:restaurantId",
    authenticateRequest,
    restaurantOwnerOnly,
    httpService.update.bind(httpService),
  );
  router.post(
    "/:restaurantId/menu-items",
    authenticateRequest,
    restaurantOwnerOnly,
    httpService.createItem.bind(httpService),
  );
  router.get(
    "/:restaurantId/menu-items",
    httpService.listItems.bind(httpService),
  );
  router.patch(
    "/:restaurantId/menu-items/:itemId",
    authenticateRequest,
    restaurantOwnerOnly,
    httpService.updateItem.bind(httpService),
  );

  return router;
};
