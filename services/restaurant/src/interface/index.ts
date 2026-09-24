import { RestaurantListQuery } from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { RestaurantStatus } from "../share/enums/index.js";

export type CreateRestaurantData = Restaurant;

export type UpdateRestaurantData = Partial<
  Pick<
    Restaurant,
    | "name"
    | "description"
    | "phone"
    | "address"
    | "latitude"
    | "longitude"
  >
>;

export type RestaurantListResult = {
  items: Restaurant[];
  total: number;
};

export interface IRestaurantRepository {
  create(data: CreateRestaurantData): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;
  findMany(query: RestaurantListQuery): Promise<RestaurantListResult>;
  update(id: string, data: UpdateRestaurantData): Promise<Restaurant>;
  updateStatus(id: string, status: RestaurantStatus): Promise<Restaurant>;
  softDelete(id: string): Promise<void>;
}

export interface IAuthService {
  verifyAccessToken(accessToken: string): Promise<Requester>;
}

export interface ICommandHandler<Command, Result> {
  execute(command: Command): Promise<Result>;
}

export interface IQueryHandler<Query, Result> {
  query(query: Query): Promise<Result>;
}
