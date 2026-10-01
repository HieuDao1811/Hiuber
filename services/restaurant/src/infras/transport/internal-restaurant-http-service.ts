import type { Request, Response } from "express";
import { OrderContextSchema } from "../../model/restaurant.dto.js";
import type { GetOrderContextQueryHandler } from "../../usecase/get-order-context.js";

export class InternalRestaurantHttpService {
  constructor(
    private readonly getOrderContextQuery: GetOrderContextQueryHandler,
  ) {}

  async getOrderContext(request: Request, response: Response) {
    const input = OrderContextSchema.parse(request.body);
    const context = await this.getOrderContextQuery.query(
      input.restaurantId,
      input.menuItemIds,
    );
    return response.status(200).json(context);
  }
}
