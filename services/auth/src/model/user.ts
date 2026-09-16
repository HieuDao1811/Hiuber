import { z } from "zod";
import { Role } from "../share/enums/index.js";

export const UserSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(2),
  email: z.email(),
  passwordHash: z.string(),
  role: z.enum(Role),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;