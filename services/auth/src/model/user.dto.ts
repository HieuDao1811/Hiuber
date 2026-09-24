import z from "zod";
import { Role } from "../share/enums/index.js";

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(Role).default(Role.CUSTOMER)
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export type Login = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const VerifyAccessTokenSchema = z.object({
  accessToken: z.string().min(1),
});

export const TokenPayloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(Role),
});
