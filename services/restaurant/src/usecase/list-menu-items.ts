import {
  CursorPage,
  CursorQuery,
  IMenuItemRepository,
  IRestaurantRepository,
} from "../interface/index.js";
import { MenuItem } from "../model/restaurant.js";
import { toCursorPage } from "./pagination.js";
import { findRestaurantOrThrow } from "./restaurant-access.js";

export type ListMenuItemsQuery = CursorQuery & {
  restaurantId: string;
};

export class ListMenuItemsQueryHandler {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
  ) {}

  async query(query: ListMenuItemsQuery): Promise<CursorPage<MenuItem>> {
    const { restaurantId, limit } = query;

    await findRestaurantOrThrow(this.restaurantRepository, restaurantId);
    const items = await this.menuItemRepository.findAvailablePage(
      restaurantId,
      query,
    );
    return toCursorPage(items, limit);
  }
}
