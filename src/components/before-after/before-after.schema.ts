import { z } from "zod";

import { ImageReferenceSchema } from "../../schemas/shared.js";

export const BeforeAfterPanelSchema = ImageReferenceSchema.extend({
  label: z.string().min(1).max(40),
});

export const BeforeAfterSchema = z
  .object({
    type: z.literal("before-after"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    before: BeforeAfterPanelSchema,
    after: BeforeAfterPanelSchema,
  })
  .strict();

export type BeforeAfterData = z.infer<typeof BeforeAfterSchema>;
