import { z } from "zod";

import { ImageReferenceSchema, LinkSchema } from "../../schemas/shared.js";

export const featureGridColumnNames = ["1", "2", "3", "4"] as const;

export const FeatureGridItemSchema = z
  .object({
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(320).optional(),
    image: ImageReferenceSchema.optional(),
    imageLayout: z.enum(["inline", "stacked"]).optional(),
    cta: LinkSchema.optional(),
    selected: z.boolean().optional(),
  })
  .strict();

export const FeatureGridSchema = z
  .object({
    type: z.literal("feature-grid"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    columns: z.enum(featureGridColumnNames).default("3"),
    items: z.array(FeatureGridItemSchema).min(1).max(99),
  })
  .strict();

export type FeatureGridData = z.infer<typeof FeatureGridSchema>;
