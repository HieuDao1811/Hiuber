import {
  CursorPage,
  CursorQuery,
  IQueryHandler,
  IRestaurantRepository,
} from "../interface/index.js";
import { Restaurant } from "../model/restaurant.js";
import { toCursorPage } from "./pagination.js";

export class ListRestaurantsQueryHandler
  implements IQueryHandler<CursorQuery, CursorPage<Restaurant>>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  async query(query: CursorQuery): Promise<CursorPage<Restaurant>> {
    const restaurants = await this.repository.findOpenPage(query);
    return toCursorPage(restaurants, query.limit);
  }
}
