import { Requester } from "../model/requester.js";
import { MenuItem, Restaurant } from "../model/restaurant.js";

export type CursorQuery = {
  limit: number;
  cursor?: string;
};

export type CursorPage<Item> = {
  items: Item[];
  nextCursor: string | null;
};

export type CreateRestaurantData = {
  ownerUserId: string;
  name: string;
  address: string;
};

export type UpdateRestaurantData = Partial<
  Pick<Restaurant, "name" | "address" | "status">
>;

export interface IRestaurantRepository {
  create(data: CreateRestaurantData): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findOpenPage(query: CursorQuery): Promise<Restaurant[]>;
  update(id: string, data: UpdateRestaurantData): Promise<Restaurant>;
}

export type CreateMenuItemData = {
  restaurantId: string;
  name: string;
  price: string;
  imageUrl?: string | null;
};

export type UpdateMenuItemData = Partial<
  Pick<MenuItem, "name" | "price" | "imageUrl" | "isAvailable">
>;

export interface IMenuItemRepository {
  create(data: CreateMenuItemData): Promise<MenuItem>;
  findById(id: string): Promise<MenuItem | null>;
  findAvailablePage(
    restaurantId: string,
    query: CursorQuery,
  ): Promise<MenuItem[]>;
  update(id: string, data: UpdateMenuItemData): Promise<MenuItem>;
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
