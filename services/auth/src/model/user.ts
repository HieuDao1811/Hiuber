import { z } from "zod";
import { Role, Status } from "../share/enums/index.js";

export const UserSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().regex(/^0\d{9}$/),
  passwordHash: z.string(),
  role: z.enum(Role).default(Role.CUSTOMER),
  status: z.enum(Status).default(Status.ACTIVE),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;