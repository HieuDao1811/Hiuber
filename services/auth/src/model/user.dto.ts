import z from "zod";
import { Role } from "../share/enums/index.js";

export const CreateUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().regex(/^0\d{9}$/),
  password: z.string().min(6),
  role: z.enum(Role).default(Role.CUSTOMER)
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export type Login = z.infer<typeof LoginSchema>;