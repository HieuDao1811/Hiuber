import z from "zod";
import { Role } from "../share/enums/index.js";

const EmailSchema = z.string().trim().toLowerCase().pipe(z.email());
const PasswordSchema = z
  .string()
  .min(6)
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must not exceed 72 bytes",
  });

export const CreateUserSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
  })
  .strict();

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const LoginSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
  })
  .strict();

export type Login = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const VerifyAccessTokenSchema = z
  .object({
    accessToken: z.string().min(1),
  })
  .strict();

export const TokenPayloadSchema = z.object({
  sub: z.uuid(),
  role: z.enum(Role),
});
