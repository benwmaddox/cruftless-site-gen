import { z } from "zod";

import { LinkSchema } from "../../schemas/shared.js";

export const CtaBandSchema = z
  .object({
    type: z.literal("cta-band"),
    headline: z.string().min(1).max(120),
    body: z.string().min(1).max(240).optional(),
    primaryCta: LinkSchema,
    secondaryCta: LinkSchema.optional(),
  })
  .strict();

export type CtaBandData = z.infer<typeof CtaBandSchema>;

