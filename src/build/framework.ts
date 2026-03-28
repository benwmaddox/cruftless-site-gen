import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodIssue } from "zod";

import {
  componentDefinitions,
  renderComponent,
} from "../components/index.js";
import {
  SiteContentSchema,
  type SiteContentData,
} from "../schemas/site.schema.js";
import { renderPageDocument } from "../renderer/render-page.js";
import { emitThemeCss } from "../themes/emit-theme-css.js";
import { themes } from "../themes/index.js";
import { validateComponentRegistry } from "../validation/component-registry-validation.js";
import {
  collectSiteValidationIssues,
  type ValidationIssue,
} from "../validation/site-validation.js";
import {
  validateCssTokenUsage,
  validateThemeDefinition,
} from "../validation/theme-validation.js";

export const defaultContentPath = path.resolve(process.cwd(), "content/site.json");
export const defaultOutDir = path.resolve(process.cwd(), "dist");

const baseCssPath = fileURLToPath(new URL("../styles/base.css", import.meta.url));

export class ValidationFailure extends Error {
  constructor(
    readonly filePath: string,
    readonly issues: readonly ValidationIssue[],
  ) {
    super(formatValidationFailure(filePath, issues));
    this.name = "ValidationFailure";
  }
}

const formatPath = (pathSegments: Array<string | number>): string => {
  if (pathSegments.length === 0) {
    return "";
  }

  return pathSegments.reduce<string>((pathString, segment) => {
    if (typeof segment === "number") {
      return `${pathString}[${segment}]`;
    }

    return pathString ? `${pathString}.${segment}` : segment;
  }, "");
};

const readValueAtPath = (value: unknown, pathSegments: Array<string | number>): unknown => {
  let currentValue = value;
  for (const pathSegment of pathSegments) {
    if (typeof pathSegment === "number") {
      if (!Array.isArray(currentValue)) {
        return undefined;
      }

      currentValue = currentValue[pathSegment];
      continue;
    }

    if (typeof currentValue !== "object" || currentValue === null) {
      return undefined;
    }

    currentValue = (currentValue as Record<string, unknown>)[pathSegment];
  }

  return currentValue;
};

const getComponentTypeForIssue = (
  rawData: unknown,
  pathSegments: Array<string | number>,
): string | undefined => {
  if (
    pathSegments[0] !== "pages" ||
    typeof pathSegments[1] !== "number" ||
    pathSegments[2] !== "components" ||
    typeof pathSegments[3] !== "number"
  ) {
    return undefined;
  }

  const component = readValueAtPath(rawData, pathSegments.slice(0, 4));
  if (typeof component !== "object" || component === null) {
    return undefined;
  }

  const componentType = (component as Record<string, unknown>).type;
  return typeof componentType === "string" ? componentType : undefined;
};

const formatZodIssue = (issue: ZodIssue, rawData: unknown): ValidationIssue => {
  const componentType = getComponentTypeForIssue(rawData, issue.path);

  if (issue.code === "unrecognized_keys") {
    const keyLabel = issue.keys.length === 1 ? "key" : "keys";
    return {
      path: issue.path,
      componentType,
      message: `unknown ${keyLabel} ${issue.keys.map((key) => `'${key}'`).join(", ")}`,
    };
  }

  if (issue.code === "invalid_union_discriminator" && componentType) {
    return {
      path: issue.path,
      componentType,
      message: `unknown component type '${componentType}'`,
    };
  }

  if (issue.code === "invalid_union_discriminator") {
    const value = readValueAtPath(rawData, issue.path);
    return {
      path: issue.path,
      message: `unknown discriminator value '${String(value)}'`,
    };
  }

  return {
    path: issue.path,
    componentType,
    message: issue.message,
  };
};

const formatValidationFailure = (
  filePath: string,
  issues: readonly ValidationIssue[],
): string => {
  const lines = [`Validation failed in ${filePath}`];

  issues.forEach((issue) => {
    if (issue.source) {
      lines.push(`${issue.source}: ${issue.message}`);
      return;
    }

    const pathString = formatPath(issue.path);
    if (pathString) {
      const componentLabel = issue.componentType ? ` (${issue.componentType})` : "";
      lines.push(`${pathString}${componentLabel}: ${issue.message}`);
      return;
    }

    lines.push(issue.message);
  });

  return lines.join("\n");
};

export const loadValidatedSite = async (
  contentPath: string = defaultContentPath,
): Promise<SiteContentData> => {
  if (!existsSync(contentPath)) {
    throw new ValidationFailure(contentPath, [
      {
        path: [],
        message: "content file does not exist",
      },
    ]);
  }

  const rawJson = await readFile(contentPath, "utf8");
  let rawData: unknown;

  try {
    rawData = JSON.parse(rawJson) as unknown;
  } catch (error) {
    throw new ValidationFailure(contentPath, [
      {
        path: [],
        message: error instanceof Error ? `invalid JSON: ${error.message}` : String(error),
      },
    ]);
  }

  const frameworkIssues: ValidationIssue[] = [
    ...validateComponentRegistry(componentDefinitions),
    ...Object.entries(themes).flatMap(([themeName, theme]) =>
      validateThemeDefinition(themeName, theme),
    ),
    ...(await validateCssTokenUsage([baseCssPath, ...componentDefinitions.map((component) => component.cssPath)])),
  ];

  const parsed = SiteContentSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new ValidationFailure(contentPath, [
      ...frameworkIssues,
      ...parsed.error.issues.map((issue) => formatZodIssue(issue, rawData)),
    ]);
  }

  const contentIssues = collectSiteValidationIssues(parsed.data);
  if (frameworkIssues.length > 0 || contentIssues.length > 0) {
    throw new ValidationFailure(contentPath, [...frameworkIssues, ...contentIssues]);
  }

  return parsed.data;
};

const pageSlugToOutputPath = (slug: string, outDir: string): string => {
  if (slug === "/") {
    return path.join(outDir, "index.html");
  }

  return path.join(outDir, slug.replace(/^\//, ""), "index.html");
};

const renderSiteCss = async (themeName: keyof typeof themes): Promise<string> => {
  const componentCssChunks = await Promise.all(
    componentDefinitions.map(async (componentDefinition) => {
      const css = await readFile(componentDefinition.cssPath, "utf8");
      return `/* ${componentDefinition.type} */\n${css}`;
    }),
  );

  const baseCss = await readFile(baseCssPath, "utf8");

  return [
    "/* theme */",
    emitThemeCss(themes[themeName]),
    "/* base */",
    baseCss,
    ...componentCssChunks,
  ].join("\n\n");
};

export const buildSite = async (
  siteContent: SiteContentData,
  outDir: string = defaultOutDir,
): Promise<void> => {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, "assets"), { recursive: true });

  const css = await renderSiteCss(siteContent.site.theme);
  await writeFile(path.join(outDir, "assets", "site.css"), css, "utf8");

  for (const page of siteContent.pages) {
    const bodyHtml = page.components.map((component) => renderComponent(component)).join("\n");
    const documentHtml = renderPageDocument({
      site: siteContent.site,
      page,
      bodyHtml,
      stylesheetHref: path.posix.join("/assets", "site.css"),
    });
    const outputPath = pageSlugToOutputPath(page.slug, outDir);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, documentHtml, "utf8");
  }
};

export const buildSiteFromFile = async (
  contentPath: string = defaultContentPath,
  outDir: string = defaultOutDir,
): Promise<SiteContentData> => {
  const siteContent = await loadValidatedSite(contentPath);
  await buildSite(siteContent, outDir);
  return siteContent;
};
