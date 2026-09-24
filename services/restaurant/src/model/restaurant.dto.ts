import { z } from "zod";
import { RestaurantStatus } from "../share/enums/index.js";

const NameSchema = z.string().trim().min(1);
const AddressSchema = z.string().trim().min(1);
const ImageUrlSchema = z.union([z.url(), z.null()]);

export const RestaurantIdSchema = z.uuid();
export const MenuItemIdSchema = z.uuid();

export const CreateRestaurantSchema = z
  .object({
    name: NameSchema,
    address: AddressSchema,
  })
  .strict();

export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;

export const UpdateRestaurantSchema = z
  .object({
    name: NameSchema.optional(),
    address: AddressSchema.optional(),
    status: z.enum(RestaurantStatus).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateRestaurantInput = z.infer<typeof UpdateRestaurantSchema>;

export const CreateMenuItemSchema = z
  .object({
    name: NameSchema,
    price: z.number().finite().nonnegative(),
    imageUrl: ImageUrlSchema.optional(),
  })
  .strict();

export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;

export const UpdateMenuItemSchema = z
  .object({
    name: NameSchema.optional(),
    price: z.number().finite().nonnegative().optional(),
    imageUrl: ImageUrlSchema.optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>;

export const CursorPaginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    cursor: z.uuid().optional(),
  })
  .strict();

export type CursorPaginationInput = z.infer<typeof CursorPaginationSchema>;
