import z from "zod";

export const RestaurantSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string(),
  ownerId: z.string(),
  phone: z.number(),
  isVerified: z.boolean(),

  autoLocation: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number(), //longitude
      z.number(), //latitude
    ]),
    formattedAddress: z.string()
  }),
  isOpen: z.boolean(),
  createAt: z.date(),
})

export type Restaurant = z.infer<typeof RestaurantSchema>;