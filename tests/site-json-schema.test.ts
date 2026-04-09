import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { ErrorObject } from "ajv";
import { describe, expect, it } from "vitest";

import { componentTypeNames } from "../src/components/index.js";
import {
  buildVsCodeSettings,
  buildSiteContentJsonSchema,
  contentJsonFileMatches,
  siteContentJsonSchemaPath,
  vscodeSettingsPath,
} from "../src/schemas/site-json-schema.js";

const contentRoot = path.resolve(process.cwd(), "content");
const require = createRequire(import.meta.url);
const Ajv = require("ajv").default as typeof import("ajv").default;
const addFormats = require("ajv-formats").default as typeof import("ajv-formats").default;

type JsonSchemaValue =
  | string
  | number
  | boolean
  | null
  | JsonSchemaValue[]
  | { [key: string]: JsonSchemaValue };

type JsonSchemaObject = { [key: string]: JsonSchemaValue };

const isJsonSchemaObject = (value: JsonSchemaValue | undefined): value is JsonSchemaObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const collectJsonFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat().sort();
};

const readJsonFile = async (filePath: string): Promise<unknown> =>
  JSON.parse(await readFile(filePath, "utf8")) as unknown;

const buildContentWithHref = (href: string) => ({
  site: {
    name: "LaunchKit",
    baseUrl: "https://launchkit.example",
    theme: "friendly-modern",
  },
  pages: [
    {
      slug: "/",
      title: "Home",
      components: [
        {
          type: "hero",
          headline: "Launch faster",
          primaryCta: {
            label: "Get started",
            href,
          },
        },
      ],
    },
  ],
});

const collectComponentTypeEnumSchemas = (
  value: JsonSchemaValue | undefined,
  matches: JsonSchemaObject[] = [],
): JsonSchemaObject[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectComponentTypeEnumSchemas(item, matches);
    }

    return matches;
  }

  if (!isJsonSchemaObject(value)) {
    return matches;
  }

  const properties = value.properties;

  if (isJsonSchemaObject(properties)) {
    const typeProperty = properties.type;

    if (
      isJsonSchemaObject(typeProperty)
      && Array.isArray(typeProperty.enum)
      && typeProperty.enum.every((item) => typeof item === "string")
      && (Array.isArray(value.oneOf) || Array.isArray(value.anyOf))
    ) {
      matches.push(value);
    }
  }

  for (const nestedValue of Object.values(value)) {
    collectComponentTypeEnumSchemas(nestedValue, matches);
  }

  return matches;
};

const collectComponentSnippetSchemas = (
  value: JsonSchemaValue | undefined,
  matches: JsonSchemaObject[] = [],
): JsonSchemaObject[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectComponentSnippetSchemas(item, matches);
    }

    return matches;
  }

  if (!isJsonSchemaObject(value)) {
    return matches;
  }

  if (Array.isArray(value.defaultSnippets)) {
    matches.push(value);
  }

  for (const nestedValue of Object.values(value)) {
    collectComponentSnippetSchemas(nestedValue, matches);
  }

  return matches;
};

describe("site JSON schema", async () => {
  const contentFiles = await collectJsonFiles(contentRoot);

  it("matches the checked-in generated artifact", async () => {
    const checkedInSchema = await readJsonFile(siteContentJsonSchemaPath);

    expect(checkedInSchema).toEqual(buildSiteContentJsonSchema());
  });

  it("matches the checked-in VS Code settings artifact", async () => {
    const checkedInSettings = await readJsonFile(vscodeSettingsPath);

    expect(checkedInSettings).toEqual(buildVsCodeSettings());
  });

  it("surfaces component type enums for editor autocomplete", () => {
    const componentUnionSchemas = collectComponentTypeEnumSchemas(
      buildSiteContentJsonSchema() as JsonSchemaValue,
    );
    const pageComponentTypes = [...componentTypeNames].sort();
    const layoutComponentTypes = [...componentTypeNames, "page-content"].sort();
    const componentTypeSets = componentUnionSchemas.map((schema) =>
      [...((schema.properties as JsonSchemaObject).type as JsonSchemaObject).enum as string[]].sort(),
    );

    expect(componentTypeSets).toContainEqual(pageComponentTypes);
    expect(componentTypeSets).toContainEqual(layoutComponentTypes);
  });

  it("generates default snippets for component unions", () => {
    const componentSnippetSchemas = collectComponentSnippetSchemas(
      buildSiteContentJsonSchema() as JsonSchemaValue,
    );
    const snippetLabels = componentSnippetSchemas.flatMap((schema) =>
      (schema.defaultSnippets as JsonSchemaObject[]).map((snippet) => snippet.label),
    );
    const heroSnippet = componentSnippetSchemas
      .flatMap((schema) => schema.defaultSnippets as JsonSchemaObject[])
      .find((snippet) => snippet.label === "Hero");
    const componentShellSnippet = componentSnippetSchemas
      .flatMap((schema) => schema.defaultSnippets as JsonSchemaObject[])
      .find((snippet) => snippet.label === "Component shell");

    expect(snippetLabels).toContain("Component shell");
    expect(snippetLabels).toContain("Hero");
    expect(componentShellSnippet?.body).toEqual({
      type: "$1",
    });
    expect(heroSnippet?.body).toEqual({
      type: "hero",
      headline: "$2",
      primaryCta: {
        label: "$3",
        href: "$4",
      },
    });
    expect(
      componentSnippetSchemas
        .flatMap((schema) => schema.defaultSnippets as JsonSchemaObject[])
        .find((snippet) => snippet.label === "Cta Band")?.body,
    ).toEqual({
      type: "cta-band",
      headline: "$2",
      primaryCta: {
        label: "$3",
        href: "$4",
      },
    });
  });

  it("validates all repo content fixtures", async () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());

    for (const contentFile of contentFiles) {
      const content = await readJsonFile(contentFile);
      const isValid = validate(content);

      expect(
        isValid,
        `${path.relative(process.cwd(), contentFile)} failed schema validation: ${ajv.errorsText(validate.errors, { separator: "\n" })}`,
      ).toBe(true);
    }
  });

  it("accepts valid href variants in shared link fields", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());
    const validHrefs = [
      "/services",
      "./contact",
      "../contact",
      "#faq",
      "?ref=summer",
      "https://example.com/path?x=1#y",
      "mailto:hello@example.com",
      "tel:+15555555555",
    ];

    for (const href of validHrefs) {
      expect(validate(buildContentWithHref(href)), href).toBe(true);
    }
  });

  it("rejects invalid href variants in shared link fields", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());
    const invalidHrefs = [
      "",
      "f",
      "services/repair",
      "/start?x=<tag>",
      "https://example.com/path with space",
      "javascript:alert(1)",
      "data:text/html,hello",
      "http://",
      "mailto:",
      "tel:",
    ];

    for (const href of invalidHrefs) {
      expect(validate(buildContentWithHref(href)), href).toBe(false);
      expect(validate.errors?.some((issue: ErrorObject) => issue.keyword === "pattern"), href).toBe(
        true,
      );
    }
  });

  it("requires a hero component to provide at least one CTA", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());
    const isValid = validate({
      site: {
        name: "LaunchKit",
        baseUrl: "https://launchkit.example",
        theme: "friendly-modern",
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          components: [
            {
              type: "hero",
              headline: "Launch faster",
            },
          ],
        },
      ],
    });

    expect(isValid).toBe(false);
    expect(validate.errors?.some((issue: ErrorObject) => issue.keyword === "anyOf")).toBe(true);
  });

  it("maps all content JSON files to the generated schema in VS Code", () => {
    expect(buildVsCodeSettings()).toEqual({
      "json.schemas": [
        {
          fileMatch: contentJsonFileMatches,
          url: "./schemas/site-content.schema.json",
        },
      ],
    });
  });

  it("accepts an optional google analytics measurement ID", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());
    const isValid = validate({
      site: {
        name: "LaunchKit",
        baseUrl: "https://launchkit.example",
        theme: "friendly-modern",
        googleAnalyticsMeasurementId: "G-TEST1234",
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          components: [
            {
              type: "hero",
              headline: "Launch faster",
              primaryCta: {
                label: "Get started",
                href: "/start",
              },
            },
          ],
        },
      ],
    });

    expect(isValid).toBe(true);
  });

  it("rejects an invalid google analytics measurement ID", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(buildSiteContentJsonSchema());
    const isValid = validate({
      site: {
        name: "LaunchKit",
        baseUrl: "https://launchkit.example",
        theme: "friendly-modern",
        googleAnalyticsMeasurementId: "UA-123456",
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          components: [
            {
              type: "hero",
              headline: "Launch faster",
              primaryCta: {
                label: "Get started",
                href: "/start",
              },
            },
          ],
        },
      ],
    });

    expect(isValid).toBe(false);
    expect(validate.errors?.some((issue: ErrorObject) => issue.keyword === "pattern")).toBe(true);
  });
});
