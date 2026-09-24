import { Router } from "express";
import { RestaurantHttpService } from "../infras/transport/restaurant-http-service.js";
import { IAuthService, IRestaurantRepository } from "../interface/index.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { CreateRestaurantCommandHandler } from "../usecase/create-restaurant.js";
import { DeleteRestaurantCommandHandler } from "../usecase/delete-restaurant.js";
import { GetRestaurantQueryHandler } from "../usecase/get-restaurant.js";
import { ListRestaurantsQueryHandler } from "../usecase/list-restaurants.js";
import { UpdateRestaurantCommandHandler } from "../usecase/update-restaurant.js";
import { UpdateRestaurantStatusCommandHandler } from "../usecase/update-restaurant-status.js";

export type RestaurantRouterDependencies = {
  repository: IRestaurantRepository;
  authService: IAuthService;
};

export const createRestaurantRouter = (
  dependencies: RestaurantRouterDependencies,
) => {
  const httpService = new RestaurantHttpService(
    new CreateRestaurantCommandHandler(dependencies.repository),
    new GetRestaurantQueryHandler(dependencies.repository),
    new ListRestaurantsQueryHandler(dependencies.repository),
    new UpdateRestaurantCommandHandler(dependencies.repository),
    new UpdateRestaurantStatusCommandHandler(dependencies.repository),
    new DeleteRestaurantCommandHandler(dependencies.repository),
  );
  const authenticateRequest = authenticate(dependencies.authService);
  const router = Router();

  router.post("/", authenticateRequest, httpService.create.bind(httpService));
  router.get("/", httpService.list.bind(httpService));
  router.get("/:id", httpService.getById.bind(httpService));
  router.patch(
    "/:id/status",
    authenticateRequest,
    httpService.updateStatus.bind(httpService),
  );
  router.patch(
    "/:id",
    authenticateRequest,
    httpService.update.bind(httpService),
  );
  router.delete(
    "/:id",
    authenticateRequest,
    httpService.delete.bind(httpService),
  );

  return router;
};
