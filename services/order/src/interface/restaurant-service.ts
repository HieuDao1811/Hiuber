import type { RestaurantStatus } from "../share/enums/index.js";

export interface RestaurantOrderContext {
  restaurant: {
    id: string;
    ownerUserId: string;
    status: RestaurantStatus;
  };
  menuItems: Array<{
    id: string;
    restaurantId: string;
    name: string;
    price: string;
    isAvailable: boolean;
  }>;
}

export interface IRestaurantService {
  getOrderContext(
    restaurantId: string,
    menuItemIds: string[],
  ): Promise<RestaurantOrderContext>;
}
