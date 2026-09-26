import { z } from "zod";

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  RESTAURANT = "RESTAURANT",
  RIDER = "RIDER",
}

export const RequesterSchema = z.object({
  userId: z.uuid(),
  role: z.enum(UserRole),
});

export type Requester = z.infer<typeof RequesterSchema>;
