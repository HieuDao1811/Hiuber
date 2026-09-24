import { z } from "zod";
import { Role, UserStatus } from "../share/enums/index.js";

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  passwordHash: z.string(),
  role: z.enum(Role).default(Role.CUSTOMER),
  status: z.enum(UserStatus).default(UserStatus.ACTIVE),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;
