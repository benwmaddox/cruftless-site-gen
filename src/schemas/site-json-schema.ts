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
type JsonSchemaSnippet = {
  label: string;
  description?: string;
  body: JsonSchemaValue;
};

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

const toJsonPointerPathSegment = (segment: string): string =>
  segment.replace(/~1/g, "/").replace(/~0/g, "~");

const resolveJsonPointer = (
  rootSchema: JsonSchemaObject,
  ref: string,
): JsonSchemaObject | undefined => {
  if (!ref.startsWith("#/")) {
    return undefined;
  }

  const pathSegments = ref
    .slice(2)
    .split("/")
    .map((segment) => toJsonPointerPathSegment(segment));
  let currentValue: JsonSchemaValue = rootSchema;

  for (const pathSegment of pathSegments) {
    if (!isJsonSchemaObject(currentValue)) {
      return undefined;
    }

    currentValue = currentValue[pathSegment];
  }

  return isJsonSchemaObject(currentValue) ? currentValue : undefined;
};

const resolveSchema = (
  schema: JsonSchemaObject,
  rootSchema: JsonSchemaObject,
): JsonSchemaObject | undefined => {
  let currentSchema: JsonSchemaObject | undefined = schema;
  const seenRefs = new Set<string>();

  while (currentSchema && typeof currentSchema.$ref === "string") {
    if (seenRefs.has(currentSchema.$ref)) {
      return undefined;
    }

    seenRefs.add(currentSchema.$ref);
    currentSchema = resolveJsonPointer(rootSchema, currentSchema.$ref);
  }

  return currentSchema;
};

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

const appendUniqueStrings = (values: string[], additions: readonly string[]): string[] => {
  const seenValues = new Set(values);

  for (const addition of additions) {
    if (seenValues.has(addition)) {
      continue;
    }

    values.push(addition);
    seenValues.add(addition);
  }

  return values;
};

const getSnippetRequiredPropertyNames = (
  schema: JsonSchemaObject,
  rootSchema: JsonSchemaObject,
): string[] => {
  const resolvedSchema = resolveSchema(schema, rootSchema);

  if (!resolvedSchema) {
    return [];
  }

  const requiredPropertyNames = isStringArray(resolvedSchema.required)
    ? [...resolvedSchema.required]
    : [];

  for (const unionKeyword of unionKeywords) {
    const unionEntries = resolvedSchema[unionKeyword];

    if (!Array.isArray(unionEntries) || unionEntries.length === 0) {
      continue;
    }

    const firstUnionEntry = unionEntries[0];

    if (!isJsonSchemaObject(firstUnionEntry)) {
      continue;
    }

    const resolvedUnionEntry = resolveSchema(firstUnionEntry, rootSchema);

    if (!resolvedUnionEntry || !isStringArray(resolvedUnionEntry.required)) {
      continue;
    }

    appendUniqueStrings(requiredPropertyNames, resolvedUnionEntry.required);
    break;
  }

  return requiredPropertyNames;
};

const createSnippetPlaceholder = (index: number, defaultValue?: string): string =>
  defaultValue && defaultValue.length > 0 ? `\${${index}:${defaultValue}}` : `$${index}`;

const createSnippetChoice = (index: number, choices: readonly string[]): string =>
  `\${${index}|${choices.join(",")}|}`;

const createRawSnippetPlaceholder = (index: number, defaultValue: string): string =>
  `^${createSnippetPlaceholder(index, defaultValue)}`;

const createRawSnippetChoice = (index: number, choices: readonly string[]): string =>
  `^${createSnippetChoice(index, choices)}`;

const createComponentSnippetLabel = (componentType: string): string =>
  componentType
    .split("-")
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(" ");

const createComponentShellSnippet = (): JsonSchemaSnippet => ({
  label: "Component shell",
  description: "Insert a component object with a type placeholder.",
  body: {
    type: "$1",
  },
});

const buildSnippetValue = (
  schema: JsonSchemaObject,
  rootSchema: JsonSchemaObject,
  nextTabStop: () => number,
): JsonSchemaValue => {
  const resolvedSchema = resolveSchema(schema, rootSchema);

  if (!resolvedSchema) {
    return createSnippetPlaceholder(nextTabStop());
  }

  if (
    Array.isArray(resolvedSchema.enum)
    && resolvedSchema.enum.length > 0
    && resolvedSchema.enum.every((item) => typeof item === "string")
  ) {
    return createSnippetChoice(nextTabStop(), resolvedSchema.enum as string[]);
  }

  if (typeof resolvedSchema.const === "string") {
    return resolvedSchema.const;
  }

  if (typeof resolvedSchema.const === "number" || typeof resolvedSchema.const === "boolean") {
    return resolvedSchema.const;
  }

  if (resolvedSchema.type === "object") {
    const properties = isJsonSchemaObject(resolvedSchema.properties) ? resolvedSchema.properties : {};
    const requiredPropertyNames = getSnippetRequiredPropertyNames(resolvedSchema, rootSchema);
    const snippetObject: JsonSchemaObject = {};

    for (const requiredPropertyName of requiredPropertyNames) {
      const propertySchema = properties[requiredPropertyName];

      if (!isJsonSchemaObject(propertySchema)) {
        continue;
      }

      snippetObject[requiredPropertyName] = buildSnippetValue(
        propertySchema,
        rootSchema,
        nextTabStop,
      );
    }

    return snippetObject;
  }

  if (resolvedSchema.type === "array") {
    if (!isJsonSchemaObject(resolvedSchema.items)) {
      return [];
    }

    const minimumItems = typeof resolvedSchema.minItems === "number" ? resolvedSchema.minItems : 0;

    if (minimumItems < 1) {
      return [];
    }

    return [buildSnippetValue(resolvedSchema.items, rootSchema, nextTabStop)];
  }

  if (resolvedSchema.type === "integer" || resolvedSchema.type === "number") {
    return createRawSnippetPlaceholder(nextTabStop(), "0");
  }

  if (resolvedSchema.type === "boolean") {
    return createRawSnippetChoice(nextTabStop(), ["true", "false"]);
  }

  return createSnippetPlaceholder(nextTabStop());
};

const buildComponentDefaultSnippets = (
  discriminatedUnionBranches: JsonSchemaObject[],
  rootSchema: JsonSchemaObject,
): JsonSchemaSnippet[] => {
  const snippets: JsonSchemaSnippet[] = [createComponentShellSnippet()];

  for (const branch of discriminatedUnionBranches) {
    const componentType = getComponentTypeConst(branch);

    if (!componentType) {
      continue;
    }

    let tabStopIndex = 1;
    const nextTabStop = (): number => {
      tabStopIndex += 1;
      return tabStopIndex;
    };
    const snippetBody = buildSnippetValue(branch, rootSchema, nextTabStop);

    if (!isJsonSchemaObject(snippetBody)) {
      continue;
    }

    snippets.push({
      label: createComponentSnippetLabel(componentType),
      description: `Insert a ${componentType} component with required fields.`,
      body: snippetBody,
    });
  }

  return snippets;
};

const enrichDiscriminatedUnionSchemas = (
  value: JsonSchemaValue | undefined,
  rootSchema: JsonSchemaObject,
): void => {
  if (Array.isArray(value)) {
    for (const item of value) {
      enrichDiscriminatedUnionSchemas(item, rootSchema);
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
    value.defaultSnippets = buildComponentDefaultSnippets(discriminatedUnionBranches, rootSchema);
  }

  for (const nestedValue of Object.values(value)) {
    enrichDiscriminatedUnionSchemas(nestedValue, rootSchema);
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

  enrichDiscriminatedUnionSchemas(schema, schema);

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
