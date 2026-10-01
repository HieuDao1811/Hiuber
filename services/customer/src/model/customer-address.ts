import { z } from "zod";

const labelSchema = z.string().trim().min(1).max(50).nullable();
const receiverNameSchema = z.string().trim().min(1).max(100);
const receiverPhoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+()\-\s]{7,20}$/);
const addressSchema = z.string().trim().min(1).max(300);

export const AddressIdParamsSchema = z
  .object({ addressId: z.uuid() })
  .strict();

export const CreateCustomerAddressSchema = z
  .object({
    label: labelSchema.optional(),
    receiverName: receiverNameSchema,
    receiverPhone: receiverPhoneSchema,
    address: addressSchema,
  })
  .strict();

export const UpdateCustomerAddressSchema = z
  .object({
    label: labelSchema.optional(),
    receiverName: receiverNameSchema.optional(),
    receiverPhone: receiverPhoneSchema.optional(),
    address: addressSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const EmptyBodySchema = z.object({}).strict();

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string | null;
  receiverName: string;
  receiverPhone: string;
  address: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCustomerAddressInput = z.infer<
  typeof CreateCustomerAddressSchema
>;
export type UpdateCustomerAddressInput = z.infer<
  typeof UpdateCustomerAddressSchema
>;
