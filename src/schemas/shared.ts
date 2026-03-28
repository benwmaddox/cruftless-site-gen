import { z } from "zod";

export const LinkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
  })
  .strict();

export type LinkData = z.infer<typeof LinkSchema>;

