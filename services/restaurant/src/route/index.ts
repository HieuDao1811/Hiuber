import { Router } from "express";
import { RestaurantHttpService } from "../infras/transport/restaurant-http-service.js";
import {
  IAuthService,
  IMenuItemRepository,
  IRestaurantRepository,
  UploadImage,
} from "../interface/index.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
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
  uploadImage: UploadImage;
};

export const createRestaurantRouter = (
  dependencies: RestaurantRouterDependencies,
) => {
  const { restaurantRepository, menuItemRepository, authService, uploadImage } =
    dependencies;
  const httpService = new RestaurantHttpService({
    createRestaurant: new CreateRestaurantCommandHandler(restaurantRepository),
    listRestaurants: new ListRestaurantsQueryHandler(restaurantRepository),
    getRestaurant: new GetRestaurantQueryHandler(restaurantRepository),
    updateRestaurant: new UpdateRestaurantCommandHandler(restaurantRepository),
    createMenuItem: new CreateMenuItemCommandHandler(
      restaurantRepository,
      menuItemRepository,
      uploadImage,
    ),
    listMenuItems: new ListMenuItemsQueryHandler(
      restaurantRepository,
      menuItemRepository,
    ),
    updateMenuItem: new UpdateMenuItemCommandHandler(
      restaurantRepository,
      menuItemRepository,
      uploadImage,
    ),
  });
  const authenticateRequest = authenticate(authService);
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
    upload.single("logo"),
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
    upload.single("logo"),
    httpService.updateItem.bind(httpService),
  );

  return router;
};
