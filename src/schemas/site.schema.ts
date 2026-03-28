import { z } from "zod";

import { ComponentSchema } from "../components/index.js";
import { themeNames } from "../themes/index.js";

export const PageMetadataSchema = z
  .object({
    description: z.string().min(1).max(200).optional(),
    canonicalUrl: z.string().url().optional(),
  })
  .strict();

export const PageSchema = z
  .object({
    slug: z.string().min(1).regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/i),
    title: z.string().min(1).max(80),
    metadata: PageMetadataSchema.optional(),
    components: z.array(ComponentSchema).min(1),
  })
  .strict();

export const SiteSchema = z
  .object({
    name: z.string().min(1).max(80),
    baseUrl: z.string().url(),
    theme: z.enum(themeNames),
  })
  .strict();

export const SiteContentSchema = z
  .object({
    site: SiteSchema,
    pages: z.array(PageSchema).min(1),
  })
  .strict();

export type PageData = z.infer<typeof PageSchema>;
export type SiteData = z.infer<typeof SiteSchema>;
export type SiteContentData = z.infer<typeof SiteContentSchema>;

