import { z } from "zod";

export const LogoStripItemSchema = z
  .object({
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200),
    href: z.string().min(1).max(2048).optional(),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
  })
  .strict();

export const LogoStripSchema = z
  .object({
    type: z.literal("logo-strip"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    logos: z.array(LogoStripItemSchema).min(2).max(24),
  })
  .strict();

export type LogoStripData = z.infer<typeof LogoStripSchema>;
