import { z } from "zod";

import { ImageReferenceSchema, LinkSchema } from "../../schemas/shared.js";

export const FeatureGridItemSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    image: ImageReferenceSchema.optional(),
    cta: LinkSchema.optional(),
    selected: z.boolean().optional(),
  })
  .strict();

export const FeatureGridSchema = z
  .object({
    type: z.literal("feature-grid"),
    title: z.string().min(1).max(120),
    items: z.array(FeatureGridItemSchema).min(1).max(6),
  })
  .strict();

export type FeatureGridData = z.infer<typeof FeatureGridSchema>;
