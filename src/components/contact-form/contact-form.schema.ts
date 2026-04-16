import { z } from "zod";

export const ContactFormSchema = z
  .object({
    type: z.literal("contact-form"),
    mode: z.enum(["production", "demo"]),
    title: z.string().min(1).max(120),
    intro: z.string().min(1).max(280).optional(),
    action: z.string().min(1).max(2048),
    submitLabel: z.string().min(1).max(40),
    subject: z.string().min(1).max(120).optional(),
    deliveryNote: z.string().min(1).max(200).optional(),
  })
  .strict();

export type ContactFormData = z.infer<typeof ContactFormSchema>;
