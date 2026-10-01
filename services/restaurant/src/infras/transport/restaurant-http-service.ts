import { Request, Response } from "express";
import { UnauthenticatedError } from "../../model/errors.js";
import {
  CreateMenuItemSchema,
  CreateRestaurantSchema,
  CursorPaginationSchema,
  MenuItemIdSchema,
  RestaurantIdSchema,
  UpdateMenuItemFieldsSchema,
  UpdateMenuItemSchema,
  UpdateRestaurantSchema,
} from "../../model/restaurant.dto.js";
import { Requester, RequesterSchema } from "../../model/requester.js";
import {
  cursorPageResponse,
  dataResponse,
} from "../../share/components/http-response.js";
import { CreateMenuItemCommandHandler } from "../../usecase/create-menu-item.js";
import { CreateRestaurantCommandHandler } from "../../usecase/create-restaurant.js";
import { GetRestaurantQueryHandler } from "../../usecase/get-restaurant.js";
import { ListMenuItemsQueryHandler } from "../../usecase/list-menu-items.js";
import { ListRestaurantsQueryHandler } from "../../usecase/list-restaurants.js";
import { UpdateMenuItemCommandHandler } from "../../usecase/update-menu-item.js";
import { UpdateRestaurantCommandHandler } from "../../usecase/update-restaurant.js";

const normalizeMultipartMenuItemBody = (req: Request): unknown => {
  if (!req.is("multipart/form-data")) {
    return req.body;
  }

  const body = { ...req.body };
  if (typeof body.price === "string" && body.price.trim() !== "") {
    body.price = Number(body.price);
  }
  if (body.isAvailable === "true" || body.isAvailable === "false") {
    body.isAvailable = body.isAvailable === "true";
  }
  return body;
};

type RestaurantUseCases = {
  createRestaurant: CreateRestaurantCommandHandler;
  listRestaurants: ListRestaurantsQueryHandler;
  getRestaurant: GetRestaurantQueryHandler;
  updateRestaurant: UpdateRestaurantCommandHandler;
  createMenuItem: CreateMenuItemCommandHandler;
  listMenuItems: ListMenuItemsQueryHandler;
  updateMenuItem: UpdateMenuItemCommandHandler;
};

export class RestaurantHttpService {
  constructor(private readonly useCases: RestaurantUseCases) {}

  private getRequester(res: Response): Requester {
    const requester = RequesterSchema.safeParse(res.locals.requester);
    if (!requester.success) {
      throw new UnauthenticatedError();
    }
    return requester.data;
  }

  async create(req: Request, res: Response) {
    const input = CreateRestaurantSchema.parse(req.body);
    const restaurant = await this.useCases.createRestaurant.execute({
      input,
      requester: this.getRequester(res),
    });
    return res.status(201).json(dataResponse(restaurant));
  }

  async list(req: Request, res: Response) {
    const query = CursorPaginationSchema.parse(req.query);
    const page = await this.useCases.listRestaurants.query(query);
    return res.status(200).json(cursorPageResponse(page));
  }

  async getById(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.restaurantId);
    const restaurant = await this.useCases.getRestaurant.query({ id });
    return res.status(200).json(dataResponse(restaurant));
  }

  async update(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.restaurantId);
    const input = UpdateRestaurantSchema.parse(req.body);
    const restaurant = await this.useCases.updateRestaurant.execute({
      id,
      input,
      requester: this.getRequester(res),
    });
    return res.status(200).json(dataResponse(restaurant));
  }

  async createItem(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const input = CreateMenuItemSchema.parse(normalizeMultipartMenuItemBody(req));
    const item = await this.useCases.createMenuItem.execute({
      restaurantId,
      input,
      requester: this.getRequester(res),
      logo: req.file?.buffer,
    });
    return res.status(201).json(dataResponse(item));
  }

  async listItems(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const query = CursorPaginationSchema.parse(req.query);
    const page = await this.useCases.listMenuItems.query({
      restaurantId,
      ...query,
    });
    return res.status(200).json(cursorPageResponse(page));
  }

  async updateItem(req: Request, res: Response) {
    const restaurantId = RestaurantIdSchema.parse(req.params.restaurantId);
    const itemId = MenuItemIdSchema.parse(req.params.itemId);
    const normalizedBody = normalizeMultipartMenuItemBody(req);
    const input = req.file
      ? UpdateMenuItemFieldsSchema.parse(normalizedBody)
      : UpdateMenuItemSchema.parse(normalizedBody);
    const item = await this.useCases.updateMenuItem.execute({
      restaurantId,
      itemId,
      input,
      requester: this.getRequester(res),
      logo: req.file?.buffer,
    });
    return res.status(200).json(dataResponse(item));
  }
}
