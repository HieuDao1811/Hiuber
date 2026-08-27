import z from "zod";

export const LoginUserSchemaDTO = z.object({
  email: z.email(),
  password: z.string()
});

export type LoginUserDTO = z.infer<typeof LoginUserSchemaDTO>;

export const UpdateUserSchemaDTO = z.object({
  name: z.string().optional(),
  password: z.string().optional(),
  image: z.url().optional()
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchemaDTO>;

export const CondUserDTO = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional()
});

export type CondUserDTO = z.infer<typeof CondUserDTO>;

export const PagingSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});
export type PagingDTO = z.infer<typeof PagingSchema>;