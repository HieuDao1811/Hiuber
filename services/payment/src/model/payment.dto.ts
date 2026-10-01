import { z } from "zod";
import { PaymentMethod } from "../share/enums/index.js";

export const CreatePaymentSchema = z
  .object({
    orderId: z.uuid(),
    method: z.enum(PaymentMethod),
  })
  .strict();

export const PaymentIdSchema = z.uuid();
export const IdempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(255)
  .regex(/^[\x21-\x7E]+$/, "Idempotency-Key must contain visible ASCII only");

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
