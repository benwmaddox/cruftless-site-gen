import { z } from "zod";

import { ImageReferenceSchema } from "../../schemas/shared.js";

export const MediaSchema = ImageReferenceSchema.extend({
  type: z.literal("media"),
  size: z.enum(["content", "wide"]).default("wide"),
});

export type MediaData = z.infer<typeof MediaSchema>;
