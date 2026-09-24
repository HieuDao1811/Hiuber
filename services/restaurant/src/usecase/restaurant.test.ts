import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  CreateMenuItemData,
  CreateRestaurantData,
  CursorQuery,
  IMenuItemRepository,
  IRestaurantRepository,
  UpdateMenuItemData,
  UpdateRestaurantData,
} from "../interface/index.js";
import {
  MenuItemNotFoundError,
  RestaurantOwnershipError,
} from "../model/errors.js";
import {
  CreateRestaurantSchema,
  UpdateMenuItemSchema,
} from "../model/restaurant.dto.js";
import { Requester } from "../model/requester.js";
import { MenuItem, Restaurant } from "../model/restaurant.js";
import { RestaurantStatus, UserRole } from "../share/enums/index.js";
import { CreateMenuItemCommandHandler } from "./create-menu-item.js";
import { CreateRestaurantCommandHandler } from "./create-restaurant.js";
import { ListRestaurantsQueryHandler } from "./list-restaurants.js";
import { UpdateMenuItemCommandHandler } from "./update-menu-item.js";
import { UpdateRestaurantCommandHandler } from "./update-restaurant.js";

const owner: Requester = {
  sub: "11111111-1111-4111-8111-111111111111",
  role: UserRole.RESTAURANT,
};

const createRestaurant = (
  overrides: Partial<Restaurant> = {},
): Restaurant => ({
  id: randomUUID(),
  ownerUserId: owner.sub,
  name: "Cơm Nhà Sáng",
  address: "123 Nguyễn Văn Linh, Đà Nẵng",
  status: RestaurantStatus.OPEN,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

class MemoryRestaurantRepository implements IRestaurantRepository {
  constructor(public readonly restaurants: Restaurant[] = []) {}

  async create(data: CreateRestaurantData): Promise<Restaurant> {
    const restaurant = createRestaurant(data);
    this.restaurants.push(restaurant);
    return restaurant;
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find((restaurant) => restaurant.id === id) ?? null;
  }

  async findOpenPage(query: CursorQuery): Promise<Restaurant[]> {
    const openRestaurants = this.restaurants.filter(
      ({ status }) => status === RestaurantStatus.OPEN,
    );
    const cursorIndex = query.cursor
      ? openRestaurants.findIndex(({ id }) => id === query.cursor) + 1
      : 0;
    return openRestaurants.slice(cursorIndex, cursorIndex + query.limit + 1);
  }

  async update(
    id: string,
    data: UpdateRestaurantData,
  ): Promise<Restaurant> {
    const index = this.restaurants.findIndex(
      (restaurant) => restaurant.id === id,
    );
    const restaurant = { ...this.restaurants[index], ...data } as Restaurant;
    this.restaurants[index] = restaurant;
    return restaurant;
  }
}

class MemoryMenuItemRepository implements IMenuItemRepository {
  lastCreated?: CreateMenuItemData;

  constructor(public readonly items: MenuItem[] = []) {}

  async create(data: CreateMenuItemData): Promise<MenuItem> {
    this.lastCreated = data;
    const item: MenuItem = {
      id: randomUUID(),
      restaurantId: data.restaurantId,
      name: data.name,
      price: data.price,
      imageUrl: data.imageUrl ?? null,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findAvailablePage(
    restaurantId: string,
    query: CursorQuery,
  ): Promise<MenuItem[]> {
    return this.items
      .filter((item) => item.restaurantId === restaurantId && item.isAvailable)
      .slice(0, query.limit + 1);
  }

  async update(id: string, data: UpdateMenuItemData): Promise<MenuItem> {
    const index = this.items.findIndex((item) => item.id === id);
    const item = { ...this.items[index], ...data } as MenuItem;
    this.items[index] = item;
    return item;
  }
}

test("restaurant input trims text and rejects unknown or owner fields", () => {
  assert.deepEqual(
    CreateRestaurantSchema.parse({ name: "  Cơm gà  ", address: "  Đà Nẵng  " }),
    { name: "Cơm gà", address: "Đà Nẵng" },
  );
  assert.throws(() =>
    CreateRestaurantSchema.parse({
      name: "Cơm gà",
      address: "Đà Nẵng",
      ownerUserId: randomUUID(),
      unexpectedField: true,
    }),
  );
});

test("create restaurant always uses requester.sub as ownerUserId", async () => {
  const repository = new MemoryRestaurantRepository();
  const handler = new CreateRestaurantCommandHandler(repository);

  const restaurant = await handler.execute({
    requester: owner,
    input: { name: "Cơm Nhà Sáng", address: "Đà Nẵng" },
  });

  assert.equal(restaurant.ownerUserId, owner.sub);
  assert.equal(restaurant.status, RestaurantStatus.OPEN);
});

test("restaurant list exposes a cursor without dropping the extra record", async () => {
  const repository = new MemoryRestaurantRepository([
    createRestaurant(),
    createRestaurant(),
    createRestaurant(),
  ]);
  const result = await new ListRestaurantsQueryHandler(repository).query({
    limit: 2,
  });

  assert.equal(result.items.length, 2);
  assert.equal(result.nextCursor, result.items[1]?.id);
});

test("restaurant update rejects a different owner", async () => {
  const restaurant = createRestaurant();
  const handler = new UpdateRestaurantCommandHandler(
    new MemoryRestaurantRepository([restaurant]),
  );

  await assert.rejects(
    handler.execute({
      id: restaurant.id,
      input: { name: "Tên mới" },
      requester: { ...owner, sub: randomUUID() },
    }),
    RestaurantOwnershipError,
  );
});

test("menu item price crosses the repository boundary as a string", async () => {
  const restaurant = createRestaurant();
  const menuRepository = new MemoryMenuItemRepository();
  const handler = new CreateMenuItemCommandHandler(
    new MemoryRestaurantRepository([restaurant]),
    menuRepository,
  );

  const item = await handler.execute({
    restaurantId: restaurant.id,
    requester: owner,
    input: { name: "Cơm gà", price: 45000 },
  });

  assert.equal(menuRepository.lastCreated?.price, "45000");
  assert.equal(item.price, "45000");
});

test("menu update accepts null imageUrl and rejects an item from another restaurant", async () => {
  assert.deepEqual(UpdateMenuItemSchema.parse({ imageUrl: null }), {
    imageUrl: null,
  });

  const restaurant = createRestaurant();
  const otherRestaurantId = randomUUID();
  const item: MenuItem = {
    id: randomUUID(),
    restaurantId: otherRestaurantId,
    name: "Cơm gà",
    price: "45000",
    imageUrl: null,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const handler = new UpdateMenuItemCommandHandler(
    new MemoryRestaurantRepository([restaurant]),
    new MemoryMenuItemRepository([item]),
  );

  await assert.rejects(
    handler.execute({
      restaurantId: restaurant.id,
      itemId: item.id,
      requester: owner,
      input: { isAvailable: false },
    }),
    MenuItemNotFoundError,
  );
});
