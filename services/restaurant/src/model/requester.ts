import { z } from "zod";
import { UserRole } from "../share/enums/index.js";

export const RequesterSchema = z
  .object({
    sub: z.uuid(),
    role: z.enum(UserRole),
  })
  .strict();

export type Requester = z.infer<typeof RequesterSchema>;
