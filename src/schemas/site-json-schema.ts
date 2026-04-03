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

const unionKeywords = ["oneOf", "anyOf"] as const;

export const contentJsonFileMatches = ["/content/*.json", "/content/**/*.json"];
export const siteContentJsonSchemaPath = fileURLToPath(
  new URL("../../schemas/site-content.schema.json", import.meta.url),
);
export const vscodeSettingsPath = fileURLToPath(new URL("../../.vscode/settings.json", import.meta.url));

const isJsonSchemaObject = (value: JsonSchemaValue | undefined): value is JsonSchemaObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: JsonSchemaValue | undefined): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const getComponentTypeConst = (schema: JsonSchemaObject): string | undefined => {
  const properties = schema.properties;

  if (!isJsonSchemaObject(properties)) {
    return undefined;
  }

  const typeProperty = properties.type;

  if (!isJsonSchemaObject(typeProperty) || typeof typeProperty.const !== "string") {
    return undefined;
  }

  return typeProperty.const;
};

const getDiscriminatedUnionBranches = (schema: JsonSchemaObject): JsonSchemaObject[] | undefined => {
  for (const unionKeyword of unionKeywords) {
    const unionEntries = schema[unionKeyword];

    if (!Array.isArray(unionEntries) || unionEntries.length === 0) {
      continue;
    }

    const branches: JsonSchemaObject[] = [];

    for (const unionEntry of unionEntries) {
      if (!isJsonSchemaObject(unionEntry)) {
        return undefined;
      }

      const nestedBranches = getDiscriminatedUnionBranches(unionEntry);

      if (nestedBranches) {
        branches.push(...nestedBranches);
        continue;
      }

      if (!getComponentTypeConst(unionEntry)) {
        return undefined;
      }

      branches.push(unionEntry);
    }

    if (branches.length < 2) {
      return undefined;
    }

    const branchTypeNames = branches
      .map((branch) => getComponentTypeConst(branch))
      .filter((value): value is string => typeof value === "string");

    if (branchTypeNames.length !== branches.length) {
      return undefined;
    }

    if (new Set(branchTypeNames).size !== branchTypeNames.length) {
      return undefined;
    }

    return branches;
  }

  return undefined;
};

const enrichDiscriminatedUnionSchemas = (value: JsonSchemaValue | undefined): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      enrichDiscriminatedUnionSchemas(item);
    }

    return;
  }

  if (!isJsonSchemaObject(value)) {
    return;
  }

  const discriminatedUnionBranches = getDiscriminatedUnionBranches(value);

  if (discriminatedUnionBranches) {
    const existingProperties = isJsonSchemaObject(value.properties) ? value.properties : {};
    const existingTypeProperty = isJsonSchemaObject(existingProperties.type)
      ? existingProperties.type
      : {};
    const typeEnum = discriminatedUnionBranches
      .map((branch) => getComponentTypeConst(branch))
      .filter((componentType): componentType is string => typeof componentType === "string");
    const requiredProperties = isStringArray(value.required) ? [...value.required] : [];

    value.type = "object";
    value.properties = {
      ...existingProperties,
      type: {
        ...existingTypeProperty,
        type: "string",
        enum: typeEnum,
        description: "Component type. This selects which properties are valid for the object.",
      },
    };
    value.required = requiredProperties.includes("type")
      ? requiredProperties
      : ["type", ...requiredProperties];
  }

  for (const nestedValue of Object.values(value)) {
    enrichDiscriminatedUnionSchemas(nestedValue);
  }
};

const findHeroComponentSchemas = (
  value: JsonSchemaValue | undefined,
  matches: JsonSchemaObject[] = [],
): JsonSchemaObject[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      findHeroComponentSchemas(item, matches);
    }

    return matches;
  }

  if (!isJsonSchemaObject(value)) {
    return matches;
  }

  const typeProperty = value.properties;

  if (isJsonSchemaObject(typeProperty)) {
    const typeEntry = typeProperty.type;

    if (isJsonSchemaObject(typeEntry) && typeEntry.const === "hero") {
      matches.push(value);
    }
  }

  for (const nestedValue of Object.values(value)) {
    findHeroComponentSchemas(nestedValue, matches);
  }

  return matches;
};

export const buildSiteContentJsonSchema = (): JsonSchemaObject => {
  const schema = zodToJsonSchema(SiteContentSchema, "SiteContent") as JsonSchemaObject;

  schema.title = "Cruftless Site Content";
  schema.description =
    "Schema for cruftless-site-gen site content files under content/**/*.json.";

  enrichDiscriminatedUnionSchemas(schema);

  const heroComponentSchemas = findHeroComponentSchemas(schema);

  if (heroComponentSchemas.length === 0) {
    throw new Error("Could not find hero component schema in generated JSON schema output");
  }

  for (const heroComponentSchema of heroComponentSchemas) {
    heroComponentSchema.anyOf = [
      { required: ["primaryCta"] },
      { required: ["secondaryCta"] },
    ];
  }

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
