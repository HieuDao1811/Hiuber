import z from "zod";
import { Role, Status } from "../config/enum.js";

export const LoginUserDTOSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

export type LoginUserDTO = z.infer<typeof LoginUserDTOSchema>;

export const GoogleLoginDTOSchema = z.object({
  code: z.string().min(1)
});

export type GoogleLoginDTO = z.infer<typeof GoogleLoginDTOSchema>;

export const UpdateUserDTOSchema = z.object({
  name: z.string().optional(),
  password: z.string().optional(),
  image: z.url().optional()
});

export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;

export const RegisterUserDTOSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(6),
  image: z.url(),
  status: z.enum(Status).default(Status.ACTIVE),
  role: z.enum(Role).default(Role.CUSTOMER)
})

export type RegisterUserDTO = z.infer<typeof RegisterUserDTOSchema>;

export const CreateUserDTOSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(6),
  status: z.enum(Status).default(Status.ACTIVE),
  role: z.enum(Role).default(Role.CUSTOMER),
  image: z.url()
})

export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>;

export const CondUserDTOSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional()
});

export type CondUserDTO = z.infer<typeof CondUserDTOSchema>;

export const PagingSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});
export type PagingDTO = z.infer<typeof PagingSchema>;