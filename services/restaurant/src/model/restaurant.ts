import { RestaurantStatus } from "../share/enums/index.js";

export type Restaurant = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: RestaurantStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
