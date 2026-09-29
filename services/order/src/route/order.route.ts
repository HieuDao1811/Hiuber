import { Router } from "express";
import { OrderHttpService } from "../infras/transport/order-http-service.js";
import type { IAuthService } from "../interface/auth-service.js";
import type { ICustomerService } from "../interface/customer-service.js";
import type { IOrderRepository } from "../interface/order-repository.js";
import type { IRestaurantService } from "../interface/restaurant-service.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { UserRole } from "../share/enums/index.js";
import { CreateOrderCommandHandler } from "../usecase/create-order.js";
import { GetCustomerOrderQueryHandler } from "../usecase/get-customer-order.js";
import { GetRestaurantOrderQueryHandler } from "../usecase/get-restaurant-order.js";
import { ListCustomerOrdersQueryHandler } from "../usecase/list-customer-orders.js";
import { ListRestaurantOrdersQueryHandler } from "../usecase/list-restaurant-orders.js";
import { UpdateOrderStatusCommandHandler } from "../usecase/update-order-status.js";

export interface OrderRouterDependencies {
  orders: IOrderRepository;
  authService: IAuthService;
  customerService: ICustomerService;
  restaurantService: IRestaurantService;
  deliveryFee: string;
}

const createHttpService = (dependencies: OrderRouterDependencies) =>
  new OrderHttpService({
    createOrder: new CreateOrderCommandHandler(
      dependencies.orders,
      dependencies.customerService,
      dependencies.restaurantService,
      dependencies.deliveryFee,
    ),
    listCustomerOrders: new ListCustomerOrdersQueryHandler(dependencies.orders),
    getCustomerOrder: new GetCustomerOrderQueryHandler(dependencies.orders),
    listRestaurantOrders: new ListRestaurantOrdersQueryHandler(
      dependencies.orders,
      dependencies.restaurantService,
    ),
    getRestaurantOrder: new GetRestaurantOrderQueryHandler(
      dependencies.orders,
      dependencies.restaurantService,
    ),
    updateOrderStatus: new UpdateOrderStatusCommandHandler(
      dependencies.orders,
      dependencies.restaurantService,
    ),
  });

export const createCustomerOrderRouter = (
  dependencies: OrderRouterDependencies,
) => {
  const httpService = createHttpService(dependencies);
  const router = Router();

  router.use(
    authenticate(dependencies.authService),
    authorize(UserRole.CUSTOMER),
  );
  router.post("/", httpService.create.bind(httpService));
  router.get("/", httpService.listCustomer.bind(httpService));
  router.get("/:orderId", httpService.getCustomer.bind(httpService));

  return router;
};

export const createRestaurantOrderRouter = (
  dependencies: OrderRouterDependencies,
) => {
  const httpService = createHttpService(dependencies);
  const router = Router({ mergeParams: true });

  router.use(
    authenticate(dependencies.authService),
    authorize(UserRole.RESTAURANT),
  );
  router.get("/", httpService.listRestaurant.bind(httpService));
  router.get("/:orderId", httpService.getRestaurant.bind(httpService));
  router.patch(
    "/:orderId/status",
    httpService.updateStatus.bind(httpService),
  );

  return router;
};
