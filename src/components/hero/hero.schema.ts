import { z } from "zod";

import { LinkSchema } from "../../schemas/shared.js";

export const HeroBackgroundImageSchema = z
  .object({
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200).optional(),
    position: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9% .-]+$/iu, "position must be a safe CSS background-position value")
      .default("center"),
  })
  .strict();

export const HeroSchemaBase = z
  .object({
    type: z.literal("hero"),
    headline: z.string().min(1).max(120),
    subheadline: z.string().min(1).max(240).optional(),
    primaryCta: LinkSchema.optional(),
    secondaryCta: LinkSchema.optional(),
    align: z.enum(["start", "center"]).default("start"),
    backgroundImage: HeroBackgroundImageSchema.optional(),
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
