import { z } from "zod";

import { LinkSchema } from "../../schemas/shared.js";

export const NavigationBarBrandImageSchema = z
  .object({
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200),
  })
  .strict();

export const NavigationBarSchema = z
  .object({
    type: z.literal("navigation-bar"),
    brandText: z.string().min(1).max(80).optional(),
    brandImage: NavigationBarBrandImageSchema.optional(),
    links: z.array(LinkSchema).min(1).max(12),
  })
  .strict();

export const NavigationBarSchemaBase = NavigationBarSchema;

export type NavigationBarData = z.infer<typeof NavigationBarSchema>;
