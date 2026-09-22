import { z } from "zod";
import { RestaurantStatus } from "../share/enums/index.js";

const phoneSchema = z.string().trim().regex(/^0\d{9}$/, {
  message: "Phone must contain 10 digits and start with 0",
});

const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const CreateRestaurantSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  phone: phoneSchema,
  address: z.string().trim().min(1),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
});

export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;

export const UpdateRestaurantSchema = CreateRestaurantSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: "At least one field must be provided" },
);

export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantSchema>;

export const UpdateRestaurantStatusSchema = z.object({
  status: z.enum(RestaurantStatus),
});

export type UpdateRestaurantStatusInput = z.infer<
  typeof UpdateRestaurantStatusSchema
>;

export const RestaurantIdSchema = z.string().trim().min(1);

export const RestaurantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  name: z.string().trim().min(1).optional(),
  status: z.enum(RestaurantStatus).optional(),
});

export type RestaurantListQuery = z.infer<
  typeof RestaurantListQuerySchema
>;
