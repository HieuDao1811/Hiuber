import { RestaurantStatus } from "../share/enums/index.js";

export type Restaurant = {
  id: string;
  ownerUserId: string;
  name: string;
  address: string;
  status: RestaurantStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
};
