import { z } from "zod";

import { ImageReferenceSchema } from "../../schemas/shared.js";

export const TestimonialItemSchema = z
  .object({
    quote: z.string().min(1).max(600),
    name: z.string().min(1).max(80),
    role: z.string().min(1).max(80).optional(),
    company: z.string().min(1).max(80).optional(),
    image: ImageReferenceSchema.optional(),
  })
  .strict();

export const TestimonialsSchema = z
  .object({
    type: z.literal("testimonials"),
    title: z.string().min(1).max(120),
    lead: z.string().min(1).max(280).optional(),
    items: z.array(TestimonialItemSchema).min(1).max(9),
  })
  .strict();

export type TestimonialsData = z.infer<typeof TestimonialsSchema>;
