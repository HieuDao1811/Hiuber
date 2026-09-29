import type { Request, Response } from "express";
import {
  CreateOrderSchema,
  CursorPaginationSchema,
  OrderIdSchema,
  RestaurantIdSchema,
  UpdateOrderStatusSchema,
} from "../../model/order.dto.js";
import { UnauthenticatedError } from "../../model/errors.js";
import { RequesterSchema } from "../../model/requester.js";
import {
  cursorPageResponse,
  dataResponse,
} from "../../shared/http-response.js";
import type { CreateOrderCommandHandler } from "../../usecase/create-order.js";
import type { GetCustomerOrderQueryHandler } from "../../usecase/get-customer-order.js";
import type { GetRestaurantOrderQueryHandler } from "../../usecase/get-restaurant-order.js";
import type { ListCustomerOrdersQueryHandler } from "../../usecase/list-customer-orders.js";
import type { ListRestaurantOrdersQueryHandler } from "../../usecase/list-restaurant-orders.js";
import type { UpdateOrderStatusCommandHandler } from "../../usecase/update-order-status.js";

export interface OrderUseCases {
  createOrder: CreateOrderCommandHandler;
  listCustomerOrders: ListCustomerOrdersQueryHandler;
  getCustomerOrder: GetCustomerOrderQueryHandler;
  listRestaurantOrders: ListRestaurantOrdersQueryHandler;
  getRestaurantOrder: GetRestaurantOrderQueryHandler;
  updateOrderStatus: UpdateOrderStatusCommandHandler;
}

export class OrderHttpService {
  constructor(private readonly useCases: OrderUseCases) {}

  private getUserId(response: Response): string {
    const requester = RequesterSchema.safeParse(response.locals.requester);
    if (!requester.success) {
      throw new UnauthenticatedError();
    }
    return requester.data.userId;
  }

  private getAccessToken(response: Response): string {
    const accessToken = response.locals.accessToken;
    if (typeof accessToken !== "string" || !accessToken) {
      throw new UnauthenticatedError();
    }
    return accessToken;
  }

  async create(request: Request, response: Response) {
    const input = CreateOrderSchema.parse(request.body);
    const order = await this.useCases.createOrder.execute({
      customerUserId: this.getUserId(response),
      accessToken: this.getAccessToken(response),
      input,
    });
    return response.status(201).json(dataResponse(order));
  }

  async listCustomer(request: Request, response: Response) {
    const pagination = CursorPaginationSchema.parse(request.query);
    const page = await this.useCases.listCustomerOrders.query(
      this.getUserId(response),
      pagination,
    );
    return response.status(200).json(cursorPageResponse(page));
  }

  async getCustomer(request: Request, response: Response) {
    const orderId = OrderIdSchema.parse(request.params.orderId);
    const order = await this.useCases.getCustomerOrder.query(
      orderId,
      this.getUserId(response),
    );
    return response.status(200).json(dataResponse(order));
  }

  async listRestaurant(request: Request, response: Response) {
    const restaurantId = RestaurantIdSchema.parse(request.params.restaurantId);
    const pagination = CursorPaginationSchema.parse(request.query);
    const page = await this.useCases.listRestaurantOrders.query(
      restaurantId,
      this.getUserId(response),
      pagination,
    );
    return response.status(200).json(cursorPageResponse(page));
  }

  async getRestaurant(request: Request, response: Response) {
    const restaurantId = RestaurantIdSchema.parse(request.params.restaurantId);
    const orderId = OrderIdSchema.parse(request.params.orderId);
    const order = await this.useCases.getRestaurantOrder.query(
      orderId,
      restaurantId,
      this.getUserId(response),
    );
    return response.status(200).json(dataResponse(order));
  }

  async updateStatus(request: Request, response: Response) {
    const restaurantId = RestaurantIdSchema.parse(request.params.restaurantId);
    const orderId = OrderIdSchema.parse(request.params.orderId);
    const { status } = UpdateOrderStatusSchema.parse(request.body);
    const order = await this.useCases.updateOrderStatus.execute({
      restaurantId,
      orderId,
      ownerUserId: this.getUserId(response),
      status,
    });
    return response.status(200).json(dataResponse(order));
  }
}
