import { z } from "zod";

export const MediaSchemaBase = z
  .object({
    type: z.literal("media"),
    src: z.string().min(1).max(2048),
    alt: z.string().max(200).optional(),
    caption: z.string().min(1).max(280).optional(),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
    loading: z.enum(["eager", "lazy"]).optional(),
    size: z.enum(["content", "wide"]).default("wide"),
  })
  .strict();

export const MediaSchema = MediaSchemaBase.superRefine((value, ctx) => {
  if (value.src.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["src"],
      message: "src is required",
    });
    return;
  }

  if (!value.alt || value.alt.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["alt"],
      message: "alt is required when src is provided",
    });
  }
});

export type MediaData = z.infer<typeof MediaSchema>;
