import type {
  IMenuItemRepository,
  IRestaurantRepository,
} from "../interface/index.js";
import type { MenuItem, Restaurant } from "../model/restaurant.js";
import { findRestaurantOrThrow } from "./restaurant-access.js";

export interface RestaurantOrderContext {
  restaurant: Restaurant;
  menuItems: MenuItem[];
}

export class GetOrderContextQueryHandler {
  constructor(
    private readonly restaurants: IRestaurantRepository,
    private readonly menuItems: IMenuItemRepository,
  ) {}

  async query(
    restaurantId: string,
    menuItemIds: string[],
  ): Promise<RestaurantOrderContext> {
    const restaurant = await findRestaurantOrThrow(
      this.restaurants,
      restaurantId,
    );
    const menuItems = await this.menuItems.findManyByIds(menuItemIds);

    return { restaurant, menuItems };
  }
}
