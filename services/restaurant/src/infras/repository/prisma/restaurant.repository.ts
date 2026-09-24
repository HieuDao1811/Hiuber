import type { Restaurant as PrismaRestaurant } from "../../../generated/prisma/client.js";
import {
  CreateRestaurantData,
  CursorQuery,
  IRestaurantRepository,
  UpdateRestaurantData,
} from "../../../interface/index.js";
import { Restaurant } from "../../../model/restaurant.js";
import { RestaurantStatus } from "../../../share/enums/index.js";
import { prisma } from "../../database/prisma.js";

const toDomainRestaurant = (restaurant: PrismaRestaurant): Restaurant => ({
  id: restaurant.id,
  ownerUserId: restaurant.ownerUserId,
  name: restaurant.name,
  address: restaurant.address,
  status: RestaurantStatus[restaurant.status],
  createdAt: restaurant.createdAt,
  updatedAt: restaurant.updatedAt,
});

export class PrismaRestaurantRepository implements IRestaurantRepository {
  async create(data: CreateRestaurantData): Promise<Restaurant> {
    const restaurant = await prisma.restaurant.create({ data });
    return toDomainRestaurant(restaurant);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    return restaurant ? toDomainRestaurant(restaurant) : null;
  }

  async findOpenPage(query: CursorQuery): Promise<Restaurant[]> {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: RestaurantStatus.OPEN },
      orderBy: { id: "asc" },
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    return restaurants.map(toDomainRestaurant);
  }

  async update(
    id: string,
    data: UpdateRestaurantData,
  ): Promise<Restaurant> {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data,
    });
    return toDomainRestaurant(restaurant);
  }
}
