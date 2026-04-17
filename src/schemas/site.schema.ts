import { z } from "zod";

import { ComponentSchema } from "../components/index.js";
import { themeNames } from "../themes/index.js";
import { themeTokenNames, type ThemeTokenName } from "../themes/tokens.js";

const isLocalContentAssetReference = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmedValue) || trimmedValue.startsWith("//")) {
    return false;
  }

  const normalizedValue = trimmedValue.replaceAll("\\", "/");

  if (normalizedValue.startsWith("/")) {
    return normalizedValue.startsWith("/content/");
  }

  return true;
};

const GoogleAnalyticsMeasurementIdSchema = z
  .string()
  .regex(/^G-[A-Z0-9]+$/i, "googleAnalyticsMeasurementId must look like a GA4 measurement ID");

export const PageMetadataSchema = z
  .object({
    description: z.string().min(1).max(200).optional(),
    canonicalUrl: z.string().url().optional(),
    socialImageUrl: z
      .string()
      .min(1)
      .max(2048)
      .refine(
        (value) => z.string().url().safeParse(value).success || isLocalContentAssetReference(value),
        "socialImageUrl must be an absolute URL or a content-relative asset path",
      )
      .optional(),
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

const siteCssVariableSchemaEntries = Object.fromEntries(
  themeTokenNames.map((tokenName) => [tokenName, z.string().trim().min(1).max(400).optional()]),
) as Record<ThemeTokenName, z.ZodOptional<z.ZodString>>;

export const SiteCssVariablesSchema = z.object(siteCssVariableSchemaEntries).strict();

export const SiteSchema = z
  .object({
    name: z.string().min(1).max(80),
    baseUrl: z.string().url(),
    theme: z.enum(themeNames),
    cssVariables: SiteCssVariablesSchema.optional(),
    pageBackgroundImageUrl: z
      .string()
      .min(1)
      .max(2048)
      .refine(
        (value) => z.string().url().safeParse(value).success || isLocalContentAssetReference(value),
        "pageBackgroundImageUrl must be an absolute URL or a content-relative asset path",
      )
      .optional(),
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
export type SiteCssVariablesData = z.infer<typeof SiteCssVariablesSchema>;
export type SiteData = z.infer<typeof SiteSchema>;
export type SiteContentData = z.infer<typeof SiteContentSchema>;
