import { z } from "zod";

import { LinkSchema } from "../../schemas/shared.js";

export const HeroSchemaBase = z
  .object({
    type: z.literal("hero"),
    headline: z.string().min(1).max(120),
    subheadline: z.string().min(1).max(240).optional(),
    primaryCta: LinkSchema.optional(),
    secondaryCta: LinkSchema.optional(),
    align: z.enum(["start", "center"]).default("start"),
  })
  .strict();

export const HeroSchema = HeroSchemaBase.superRefine((value, ctx) => {
    if (!value.primaryCta && !value.secondaryCta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one CTA is required",
      });
    }
  });

export type HeroData = z.infer<typeof HeroSchema>;
