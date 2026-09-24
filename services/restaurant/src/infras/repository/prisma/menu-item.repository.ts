import type { MenuItem as PrismaMenuItem } from "../../../generated/prisma/client.js";
import {
  CreateMenuItemData,
  CursorQuery,
  IMenuItemRepository,
  UpdateMenuItemData,
} from "../../../interface/index.js";
import { MenuItem } from "../../../model/restaurant.js";
import { prisma } from "../../database/prisma.js";

const toDomainMenuItem = (item: PrismaMenuItem): MenuItem => ({
  id: item.id,
  restaurantId: item.restaurantId,
  name: item.name,
  price: item.price.toString(),
  imageUrl: item.imageUrl,
  isAvailable: item.isAvailable,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export class PrismaMenuItemRepository implements IMenuItemRepository {
  async create(data: CreateMenuItemData): Promise<MenuItem> {
    const item = await prisma.menuItem.create({ data });
    return toDomainMenuItem(item);
  }

  async findById(id: string): Promise<MenuItem | null> {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    return item ? toDomainMenuItem(item) : null;
  }

  async findAvailablePage(
    restaurantId: string,
    query: CursorQuery,
  ): Promise<MenuItem[]> {
    const items = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      orderBy: { id: "asc" },
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
    });

    return items.map(toDomainMenuItem);
  }

  async update(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    const item = await prisma.menuItem.update({
      where: { id },
      data,
    });
    return toDomainMenuItem(item);
  }
}
