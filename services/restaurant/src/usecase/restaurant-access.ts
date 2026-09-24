import { IRestaurantRepository } from "../interface/index.js";
import {
  RestaurantNotFoundError,
  RestaurantOwnershipError,
} from "../model/errors.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";

export const findRestaurantOrThrow = async (
  repository: IRestaurantRepository,
  id: string,
): Promise<Restaurant> => {
  const restaurant = await repository.findById(id);
  if (!restaurant) {
    throw new RestaurantNotFoundError();
  }

  return restaurant;
};

export const findOwnedRestaurantOrThrow = async (
  repository: IRestaurantRepository,
  id: string,
  requester: Requester,
): Promise<Restaurant> => {
  const restaurant = await findRestaurantOrThrow(repository, id);
  if (restaurant.ownerUserId !== requester.sub) {
    throw new RestaurantOwnershipError();
  }

  return restaurant;
};
