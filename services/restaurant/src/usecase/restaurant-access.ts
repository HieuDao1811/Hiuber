import { IRestaurantRepository } from "../interface/index.js";
import { ForbiddenError, RestaurantNotFoundError } from "../model/errors.js";
import { Requester } from "../model/requester.js";
import { Restaurant } from "../model/restaurant.js";
import { RestaurantStatus } from "../share/enums/index.js";

export const findRestaurantOrThrow = async (
  repository: IRestaurantRepository,
  id: string,
): Promise<Restaurant> => {
  const restaurant = await repository.findById(id);

  if (
    !restaurant ||
    restaurant.status === RestaurantStatus.DELETED ||
    restaurant.deletedAt !== null
  ) {
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

  if (restaurant.ownerId !== requester.sub) {
    throw new ForbiddenError();
  }

  return restaurant;
};
