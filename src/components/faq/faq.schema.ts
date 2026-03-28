import { z } from "zod";

export const FaqItemSchema = z
  .object({
    question: z.string().min(1).max(140),
    answer: z.string().min(1).max(320),
  })
  .strict();

export const FaqSchema = z
  .object({
    type: z.literal("faq"),
    title: z.string().min(1).max(120),
    items: z.array(FaqItemSchema).min(1).max(8),
  })
  .strict();

export type FaqData = z.infer<typeof FaqSchema>;
