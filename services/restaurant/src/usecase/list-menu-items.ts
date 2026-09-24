import {
  CursorPage,
  CursorQuery,
  IMenuItemRepository,
  IQueryHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { MenuItem } from "../model/restaurant.js";
import { toCursorPage } from "./pagination.js";
import { findRestaurantOrThrow } from "./restaurant-access.js";

export type ListMenuItemsQuery = CursorQuery & {
  restaurantId: string;
};

export class ListMenuItemsQueryHandler
  implements IQueryHandler<ListMenuItemsQuery, CursorPage<MenuItem>>
{
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly menuItemRepository: IMenuItemRepository,
  ) {}

  async query(query: ListMenuItemsQuery): Promise<CursorPage<MenuItem>> {
    await findRestaurantOrThrow(
      this.restaurantRepository,
      query.restaurantId,
    );
    const items = await this.menuItemRepository.findAvailablePage(
      query.restaurantId,
      query,
    );
    return toCursorPage(items, query.limit);
  }
}
