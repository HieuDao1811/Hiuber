import { z } from "zod";

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  RESTAURANT = "RESTAURANT",
  RIDER = "RIDER",
}

export const AuthVerifyResponseSchema = z
  .object({
    sub: z.uuid(),
    role: z.enum(UserRole),
  })
  .strict();

export const RequesterSchema = z
  .object({
    userId: z.uuid(),
    role: z.enum(UserRole),
  })
  .strict();

export type Requester = z.infer<typeof RequesterSchema>;
