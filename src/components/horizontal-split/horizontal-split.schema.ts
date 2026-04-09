import { z } from "zod";

export interface HorizontalSplitData<Component = unknown> {
  type: "horizontal-split";
  title?: string;
  first: Component;
  second: Component;
}

export const createHorizontalSplitSchema = (componentSchema: z.ZodTypeAny) =>
  z
    .object({
      type: z.literal("horizontal-split"),
      title: z.string().min(1).max(120).optional(),
      first: componentSchema,
      second: componentSchema,
    })
    .strict();
