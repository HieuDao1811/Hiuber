import z from "zod";
import { Role, Status } from "../config/enum.js";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  password: z.string(),
  status: z.enum(Status).default(Status.ACTIVE),
  role: z.enum(Role).default(Role.CUSTOMER),
  image: z.url(),
})

export type User = z.infer<typeof UserSchema>;