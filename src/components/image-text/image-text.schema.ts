import { z } from "zod";

import { ImageReferenceSchema, LinkSchema } from "../../schemas/shared.js";

export const ImageTextSchema = z
  .object({
    type: z.literal("image-text"),
    eyebrow: z.string().min(1).max(40).optional(),
    title: z.string().min(1).max(120),
    paragraphs: z.array(z.string().min(1).max(600)).min(1).max(4),
    image: ImageReferenceSchema,
    imagePosition: z.enum(["start", "end"]).default("end"),
    primaryCta: LinkSchema.optional(),
    secondaryCta: LinkSchema.optional(),
  })
  .strict();

export type ImageTextData = z.infer<typeof ImageTextSchema>;
