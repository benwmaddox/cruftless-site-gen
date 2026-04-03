import { z } from "zod";

import { ComponentSchema } from "../components/index.js";
import { themeNames } from "../themes/index.js";
import {
  secondaryColorSchemeNames,
  themeStructureNames,
} from "../themes/theme-options.js";

const GoogleAnalyticsMeasurementIdSchema = z
  .string()
  .regex(/^G-[A-Z0-9]+$/i, "googleAnalyticsMeasurementId must look like a GA4 measurement ID");

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

export const PageContentSlotSchema = z
  .object({
    type: z.literal("page-content"),
  })
  .strict();

export const SiteLayoutComponentSchema = z.union([ComponentSchema, PageContentSlotSchema]);

export const SiteLayoutSchema = z
  .object({
    components: z.array(SiteLayoutComponentSchema).min(1),
  })
  .strict();

export const SiteThemeOverridesSchema = z
  .object({
    structure: z.enum(themeStructureNames).optional(),
    secondaryColorScheme: z.enum(secondaryColorSchemeNames).optional(),
  })
  .strict();

export const SiteSchema = z
  .object({
    name: z.string().min(1).max(80),
    baseUrl: z.string().url(),
    theme: z.enum(themeNames),
    themeOverrides: SiteThemeOverridesSchema.optional(),
    pageBackgroundImageUrl: z.string().url().optional(),
    googleAnalyticsMeasurementId: GoogleAnalyticsMeasurementIdSchema.optional(),
    layout: SiteLayoutSchema.optional(),
  })
  .strict();

export const SiteContentSchema = z
  .object({
    site: SiteSchema,
    pages: z.array(PageSchema).min(1),
  })
  .strict();

export type PageData = z.infer<typeof PageSchema>;
export type PageContentSlotData = z.infer<typeof PageContentSlotSchema>;
export type SiteLayoutComponentData = z.infer<typeof SiteLayoutComponentSchema>;
export type SiteLayoutData = z.infer<typeof SiteLayoutSchema>;
export type SiteThemeOverridesData = z.infer<typeof SiteThemeOverridesSchema>;
export type SiteData = z.infer<typeof SiteSchema>;
export type SiteContentData = z.infer<typeof SiteContentSchema>;
