import { z } from "zod";

export const MediaSchema = z
  .object({
    type: z.literal("media"),
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200),
    caption: z.string().min(1).max(280).optional(),
    size: z.enum(["content", "wide"]).default("wide"),
  })
  .strict();

export type MediaData = z.infer<typeof MediaSchema>;
