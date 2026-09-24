import { IQueryHandler, IRestaurantRepository } from "../interface/index.js";
import { Restaurant } from "../model/restaurant.js";
import { findRestaurantOrThrow } from "./restaurant-access.js";

export type GetRestaurantQuery = {
  id: string;
};

export class GetRestaurantQueryHandler
  implements IQueryHandler<GetRestaurantQuery, Restaurant>
{
  constructor(private readonly repository: IRestaurantRepository) {}

  query(query: GetRestaurantQuery): Promise<Restaurant> {
    return findRestaurantOrThrow(this.repository, query.id);
  }
}
