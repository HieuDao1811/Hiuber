import { Request, Response } from "express";
import { UnauthenticatedError } from "../../model/errors.js";
import {
  CreateRestaurantSchema,
  RestaurantIdSchema,
  RestaurantListQuerySchema,
  UpdateRestaurantSchema,
  UpdateRestaurantStatusSchema,
} from "../../model/restaurant.dto.js";
import { Requester, RequesterSchema } from "../../model/requester.js";
import {
  successResponse,
} from "../../share/components/http-response.js";
import { CreateRestaurantCommandHandler } from "../../usecase/create-restaurant.js";
import { DeleteRestaurantCommandHandler } from "../../usecase/delete-restaurant.js";
import { GetRestaurantQueryHandler } from "../../usecase/get-restaurant.js";
import { ListRestaurantsQueryHandler } from "../../usecase/list-restaurants.js";
import { UpdateRestaurantCommandHandler } from "../../usecase/update-restaurant.js";
import { UpdateRestaurantStatusCommandHandler } from "../../usecase/update-restaurant-status.js";

export class RestaurantHttpService {
  constructor(
    private readonly createRestaurant: CreateRestaurantCommandHandler,
    private readonly getRestaurant: GetRestaurantQueryHandler,
    private readonly listRestaurants: ListRestaurantsQueryHandler,
    private readonly updateRestaurant: UpdateRestaurantCommandHandler,
    private readonly updateRestaurantStatus: UpdateRestaurantStatusCommandHandler,
    private readonly deleteRestaurant: DeleteRestaurantCommandHandler,
  ) {}

  private getRequester(res: Response): Requester {
    const parsedRequester = RequesterSchema.safeParse(res.locals.requester);
    if (!parsedRequester.success) {
      throw new UnauthenticatedError();
    }
    return parsedRequester.data;
  }

  async create(req: Request, res: Response) {
    const input = CreateRestaurantSchema.parse(req.body);
    const requester = this.getRequester(res);
    const restaurant = await this.createRestaurant.execute({ input, requester });
    return res
      .status(201)
      .json(successResponse(restaurant, "Restaurant created successfully"));
  }

  async getById(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.id);
    const restaurant = await this.getRestaurant.query({ id });
    return res.status(200).json(successResponse(restaurant));
  }

  async list(req: Request, res: Response) {
    const query = RestaurantListQuerySchema.parse(req.query);
    const result = await this.listRestaurants.query(query);
    return res.status(200).json({
      ...successResponse(result.items),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    });
  }

  async update(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.id);
    const input = UpdateRestaurantSchema.parse(req.body);
    const requester = this.getRequester(res);
    const restaurant = await this.updateRestaurant.execute({
      id,
      input,
      requester,
    });
    return res
      .status(200)
      .json(successResponse(restaurant, "Restaurant updated successfully"));
  }

  async updateStatus(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.id);
    const { status } = UpdateRestaurantStatusSchema.parse(req.body);
    const requester = this.getRequester(res);
    const restaurant = await this.updateRestaurantStatus.execute({
      id,
      status,
      requester,
    });
    return res.status(200).json(
      successResponse(restaurant, "Restaurant status updated successfully"),
    );
  }

  async delete(req: Request, res: Response) {
    const id = RestaurantIdSchema.parse(req.params.id);
    const requester = this.getRequester(res);
    await this.deleteRestaurant.execute({ id, requester });
    return res
      .status(200)
      .json(successResponse(null, "Restaurant deleted successfully"));
  }
}
