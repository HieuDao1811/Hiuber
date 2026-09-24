import { Request, Response } from "express";
import { UnauthenticatedError } from "../../model/errors.js";
import {
  CreateMenuItemSchema,
  CreateRestaurantSchema,
  CursorPaginationSchema,
  MenuItemIdSchema,
  RestaurantIdSchema,
  UpdateMenuItemSchema,
  UpdateRestaurantSchema,
} from "../../model/restaurant.dto.js";
import { Requester, RequesterSchema } from "../../model/requester.js";
import { dataResponse } from "../../share/components/http-response.js";
import { CreateMenuItemCommandHandler } from "../../usecase/create-menu-item.js";
import { CreateRestaurantCommandHandler } from "../../usecase/create-restaurant.js";
import { GetRestaurantQueryHandler } from "../../usecase/get-restaurant.js";
import { ListMenuItemsQueryHandler } from "../../usecase/list-menu-items.js";
import { ListRestaurantsQueryHandler } from "../../usecase/list-restaurants.js";
import { UpdateMenuItemCommandHandler } from "../../usecase/update-menu-item.js";
import { UpdateRestaurantCommandHandler } from "../../usecase/update-restaurant.js";

export class RestaurantHttpService {
  constructor(
    private readonly createRestaurant: CreateRestaurantCommandHandler,
    private readonly listRestaurants: ListRestaurantsQueryHandler,
    private readonly getRestaurant: GetRestaurantQueryHandler,
    private readonly updateRestaurant: UpdateRestaurantCommandHandler,
    private readonly createMenuItem: CreateMenuItemCommandHandler,
    private readonly listMenuItems: ListMenuItemsQueryHandler,
    private readonly updateMenuItem: UpdateMenuItemCommandHandler,
  ) {}

  private getRequester(res: Response): Requester {
    const requester = RequesterSchema.safeParse(res.locals.requester);
    if (!requester.success) {
      throw new UnauthenticatedError();
    }
    return requester.data;
  }

  async create(req: Request, res: Response) {
    const input = CreateRestaurantSchema.parse(req.body);
    const restaurant = await this.createRestaurant.execute({
      input,
      requester: this.getRequester(res),
    });
    return res.status(201).json(dataResponse(restaurant));
  }

  async list(req: Request, res: Response) {
    const query = CursorPaginationSchema.parse(req.query);
    const result = await this.listRestaurants.query(query);
    return res.status(200).json({
      data: result.items,
      pagination: { nextCursor: result.nextCursor },
    });
  }

  async getById(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.restaurantId);
    const restaurant = await this.getRestaurant.query({ id });
    return res.status(200).json(dataResponse(restaurant));
  }

  async update(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.restaurantId);
    const input = UpdateRestaurantSchema.parse(req.body);
    const restaurant = await this.updateRestaurant.execute({
      id,
      input,
      requester: this.getRequester(res),
    });
    return res.status(200).json(dataResponse(restaurant));
  }

  async createItem(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const input = CreateMenuItemSchema.parse(req.body);
    const item = await this.createMenuItem.execute({
      restaurantId,
      input,
      requester: this.getRequester(res),
    });
    return res.status(201).json(dataResponse(item));
  }

  async listItems(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const query = CursorPaginationSchema.parse(req.query);
    const result = await this.listMenuItems.query({ restaurantId, ...query });
    return res.status(200).json({
      data: result.items,
      pagination: { nextCursor: result.nextCursor },
    });
  }

  async updateItem(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const itemId = MenuItemIdSchema.parse(req.params.itemId);
    const input = UpdateMenuItemSchema.parse(req.body);
    const item = await this.updateMenuItem.execute({
      restaurantId,
      itemId,
      input,
      requester: this.getRequester(res),
    });
    return res.status(200).json(dataResponse(item));
  }
}
