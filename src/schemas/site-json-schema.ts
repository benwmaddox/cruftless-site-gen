import { fileURLToPath } from "node:url";

import { zodToJsonSchema } from "zod-to-json-schema";

import { SiteContentSchema } from "./site.schema.js";

type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaValue[]
  | { [key: string]: JsonSchemaValue };

type JsonSchemaObject = { [key: string]: JsonSchemaValue };

export const contentJsonFileMatches = ["/content/*.json", "/content/**/*.json"];
export const siteContentJsonSchemaPath = fileURLToPath(
  new URL("../../schemas/site-content.schema.json", import.meta.url),
);
export const vscodeSettingsPath = fileURLToPath(new URL("../../.vscode/settings.json", import.meta.url));

const isJsonSchemaObject = (value: JsonSchemaValue | undefined): value is JsonSchemaObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const findHeroComponentSchema = (value: JsonSchemaValue | undefined): JsonSchemaObject | undefined => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findHeroComponentSchema(item);
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  if (!isJsonSchemaObject(value)) {
    return undefined;
  }

  const typeProperty = value.properties;

  if (isJsonSchemaObject(typeProperty)) {
    const typeEntry = typeProperty.type;

    if (isJsonSchemaObject(typeEntry) && typeEntry.const === "hero") {
      return value;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const match = findHeroComponentSchema(nestedValue);
    if (match) {
      return match;
    }
  }

  return undefined;
};

export const buildSiteContentJsonSchema = (): JsonSchemaObject => {
  const schema = zodToJsonSchema(SiteContentSchema, "SiteContent") as JsonSchemaObject;

  schema.title = "Cruftless Site Content";
  schema.description =
    "Schema for cruftless-site-gen site content files under content/**/*.json.";

  const heroComponentSchema = findHeroComponentSchema(schema);

  if (!heroComponentSchema) {
    throw new Error("Could not find hero component schema in generated JSON schema output");
  }

  heroComponentSchema.anyOf = [
    { required: ["primaryCta"] },
    { required: ["secondaryCta"] },
  ];

  return schema;
};

export const buildVsCodeSettings = (): JsonSchemaObject => ({
  "json.schemas": [
    {
      fileMatch: contentJsonFileMatches,
      url: "./schemas/site-content.schema.json",
    },
  ],
});
