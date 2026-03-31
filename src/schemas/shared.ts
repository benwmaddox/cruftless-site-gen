import { z } from "zod";

export const LinkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
  })
  .strict();

export type LinkData = z.infer<typeof LinkSchema>;

export const ImageReferenceSchema = z
  .object({
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200),
    caption: z.string().min(1).max(280).optional(),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
  })
  .strict();

export type ImageReferenceData = z.infer<typeof ImageReferenceSchema>;
