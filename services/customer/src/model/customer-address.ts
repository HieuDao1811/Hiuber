import { z } from "zod";

const addressFields = {
  label: z.string().trim().min(1).max(50),
  receiverName: z.string().trim().min(1).max(100),
  receiverPhone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/),
  address: z.string().trim().min(1).max(300),
};

export const AddressIdSchema = z.uuid();

export const AddressIdParamsSchema = z
  .object({ addressId: AddressIdSchema })
  .strict();

export const CreateCustomerAddressSchema = z
  .object({
    ...addressFields,
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export const UpdateCustomerAddressSchema = z
  .object({
    label: addressFields.label.optional(),
    receiverName: addressFields.receiverName.optional(),
    receiverPhone: addressFields.receiverPhone.optional(),
    address: addressFields.address.optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  isDefault: boolean;
}

export type CreateAddressInput = z.infer<typeof CreateCustomerAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateCustomerAddressSchema>;
