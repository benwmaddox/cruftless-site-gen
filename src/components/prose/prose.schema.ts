import { z } from "zod";

export const ProseSchema = z
  .object({
    type: z.literal("prose"),
    title: z.string().min(1).max(120).optional(),
    lead: z.string().min(1).max(280).optional(),
    paragraphs: z.array(z.string().min(1).max(1200)).min(1).max(12),
  })
  .strict();

export type ProseData = z.infer<typeof ProseSchema>;
