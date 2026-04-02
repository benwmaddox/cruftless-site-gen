import { z } from "zod";

import { LinkSchema } from "../../schemas/shared.js";

export const LinkListItemSchema = LinkSchema.extend({
  current: z.boolean().optional(),
});

export const LinkListSchema = z
  .object({
    type: z.literal("link-list"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    links: z.array(LinkListItemSchema).min(1).max(8),
  })
  .strict();

export type LinkListData = z.infer<typeof LinkListSchema>;
