import {
  IQueryHandler,
  IRestaurantRepository,
  RestaurantListResult,
} from "../interface/index.js";
import { RestaurantListQuery } from "../model/restaurant.dto.js";

export class ListRestaurantsQueryHandler
  implements IQueryHandler<RestaurantListQuery, RestaurantListResult>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  query(query: RestaurantListQuery): Promise<RestaurantListResult> {
    return this.repository.findMany(query);
  }
}
