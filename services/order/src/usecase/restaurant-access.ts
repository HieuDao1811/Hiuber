import type { IRestaurantService } from "../interface/restaurant-service.js";
import { ForbiddenError } from "../model/errors.js";

export const assertRestaurantOwner = async (
  restaurants: IRestaurantService,
  restaurantId: string,
  ownerUserId: string,
) => {
  const context = await restaurants.getOrderContext(restaurantId, []);
  if (context.restaurant.ownerUserId !== ownerUserId) {
    throw new ForbiddenError("You do not own this restaurant");
  }
};
