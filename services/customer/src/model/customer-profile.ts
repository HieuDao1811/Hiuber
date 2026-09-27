import { z } from "zod";

const fullNameSchema = z.string().trim().min(1).max(100);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+()\-\s]{7,20}$/)
  .nullable();

export const CreateCustomerProfileSchema = z
  .object({
    fullName: fullNameSchema,
    phone: phoneSchema.optional(),
  })
  .strict();

export const UpdateCustomerProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCustomerProfileInput = z.infer<
  typeof CreateCustomerProfileSchema
>;
export type UpdateCustomerProfileInput = z.infer<
  typeof UpdateCustomerProfileSchema
>;
