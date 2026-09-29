import { z } from "zod";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../share/enums/index.js";

const OrderItemInputSchema = z
  .object({
    menuItemId: z.uuid(),
    quantity: z.number().int().min(1).max(100),
  })
  .strict();

export const CreateOrderSchema = z
  .object({
    restaurantId: z.uuid(),
    addressId: z.uuid(),
    items: z.array(OrderItemInputSchema).min(1).max(50),
  })
  .strict()
  .superRefine((input, context) => {
    const menuItemIds = new Set<string>();
    input.items.forEach((item, index) => {
      if (menuItemIds.has(item.menuItemId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "menuItemId"],
          message: "Duplicate menu item",
        });
      }
      menuItemIds.add(item.menuItemId);
    });
  });

export const CursorPaginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    cursor: z.uuid().optional(),
  })
  .strict();

export const OrderIdSchema = z.uuid();
export const RestaurantIdSchema = z.uuid();

export const UpdateOrderStatusSchema = z
  .object({
    status: z.enum(OrderStatus),
  })
  .strict();

export const SyncPaymentStatusSchema = z
  .object({
    method: z.enum(PaymentMethod),
    status: z.enum(PaymentStatus),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
