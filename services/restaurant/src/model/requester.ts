import { z } from "zod";

export const RequesterSchema = z.object({
  sub: z.string().min(1),
  role: z.string().min(1),
});

export type Requester = z.infer<typeof RequesterSchema>;
