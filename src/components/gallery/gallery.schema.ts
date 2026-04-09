import { z } from "zod";

import { ImageReferenceSchema } from "../../schemas/shared.js";

export const GallerySchema = z
  .object({
    type: z.literal("gallery"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    columns: z.enum(["2", "3", "4"]).default("3"),
    images: z.array(ImageReferenceSchema).min(2).max(24),
  })
  .strict();

export type GalleryData = z.infer<typeof GallerySchema>;
