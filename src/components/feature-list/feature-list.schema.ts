import { z } from "zod";

export const FeatureListItemSchema = z
  .object({
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(240),
  })
  .strict();

export const FeatureListSchema = z
  .object({
    type: z.literal("feature-list"),
    title: z.string().min(1).max(120),
    items: z.array(FeatureListItemSchema).min(1).max(90),
  })
  .strict();

export type FeatureListData = z.infer<typeof FeatureListSchema>;
