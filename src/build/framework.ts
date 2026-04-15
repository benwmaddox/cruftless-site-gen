import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodIssue } from "zod";

import {
  componentDefinitions,
  type ComponentType,
  renderComponent,
} from "../components/index.js";
import { defaultComponentRenderContext } from "../components/render-context.js";
import { resolvePageComponents } from "../layout/page-layout.js";
import {
  SiteContentSchema,
  type SiteData,
  type SiteContentData,
} from "../schemas/site.schema.js";
import { explainHrefValidationFailure } from "../schemas/shared.js";
import { renderPageDocument } from "../renderer/render-page.js";
import { emitThemeCss } from "../themes/emit-theme-css.js";
import { themes } from "../themes/index.js";
import { resolveThemeDefinition } from "../themes/theme-options.js";
import { validateComponentRegistry } from "../validation/component-registry-validation.js";
import {
  collectImageValidationIssues,
  type PreparedImagePipeline,
  prepareImagePipeline,
} from "./image-pipeline.js";
import {
  collectSiteValidationIssues,
  type ValidationIssue,
} from "../validation/site-validation.js";
import { collectCopyValidationIssues } from "../validation/copy-validation.js";
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
  const isPageComponentPath =
    pathSegments[0] === "pages" &&
    typeof pathSegments[1] === "number" &&
    pathSegments[2] === "components" &&
    typeof pathSegments[3] === "number";
  const isSiteLayoutComponentPath =
    pathSegments[0] === "site" &&
    pathSegments[1] === "layout" &&
    pathSegments[2] === "components" &&
    typeof pathSegments[3] === "number";

  if (!isPageComponentPath && !isSiteLayoutComponentPath) {
    return undefined;
  }

  const component = readValueAtPath(rawData, pathSegments.slice(0, 4));
  if (typeof component !== "object" || component === null) {
    return undefined;
  }

  const componentType = (component as Record<string, unknown>).type;
  return typeof componentType === "string" ? componentType : undefined;
};

const formatValuePreview = (value: string, maxLength: number = 120): string => {
  const compactValue = value.replaceAll(/\s+/g, " ");
  const preview =
    compactValue.length > maxLength ? `${compactValue.slice(0, maxLength - 3)}...` : compactValue;

  return JSON.stringify(preview);
};

const formatHrefIssueMessage = (issue: ZodIssue, rawData: unknown): string | undefined => {
  if (issue.path.at(-1) !== "href") {
    return undefined;
  }

  const currentValue = readValueAtPath(rawData, issue.path);

  if (typeof currentValue !== "string") {
    return undefined;
  }

  const hint = explainHrefValidationFailure(currentValue);
  const details = [`received ${formatValuePreview(currentValue)}`];

  if (hint) {
    details.push(`hint: ${hint}`);
  }

  return `${issue.message} (${details.join("; ")})`;
};

const formatZodIssue = (issue: ZodIssue, rawData: unknown): ValidationIssue => {
  const componentType = getComponentTypeForIssue(rawData, issue.path);
  const formattedHrefIssueMessage = formatHrefIssueMessage(issue, rawData);

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
    message: formattedHrefIssueMessage ?? issue.message,
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
  const copyIssues = collectCopyValidationIssues(parsed.data);
  const imageIssues = await collectImageValidationIssues(parsed.data, contentPath);
  const resolvedThemeIssues = validateThemeDefinition(
    `site:${parsed.data.site.theme}`,
    resolveSiteThemeDefinition(parsed.data.site),
  );

  if (
    frameworkIssues.length > 0 ||
    contentIssues.length > 0 ||
    copyIssues.length > 0 ||
    imageIssues.length > 0 ||
    resolvedThemeIssues.length > 0
  ) {
    throw new ValidationFailure(contentPath, [
      ...frameworkIssues,
      ...contentIssues,
      ...copyIssues,
      ...imageIssues,
      ...resolvedThemeIssues,
    ]);
  }

  return parsed.data;
};

const pageSlugToOutputPath = (slug: string, outDir: string): string => {
  if (slug === "/") {
    return path.join(outDir, "index.html");
  }

  return path.join(outDir, slug.replace(/^\//, ""), "index.html");
};

const pageSlugToStylesheetHref = (slug: string): string => {
  const pagePath = slug === "/" ? "/index.html" : path.posix.join(slug, "index.html");
  return path.posix.relative(path.posix.dirname(pagePath), "/assets/site.css");
};

const pageSlugToScriptHref = (slug: string): string => {
  const pagePath = slug === "/" ? "/index.html" : path.posix.join(slug, "index.html");
  return path.posix.relative(path.posix.dirname(pagePath), "/assets/site.js");
};

const escapeCssString = (value: string): string =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("\"", "\\\"");

const emitSiteCss = (site: SiteData): string => {
  if (!site.pageBackgroundImageUrl) {
    return "";
  }

  return `:root {\n  --site-page-background-image: url("${escapeCssString(site.pageBackgroundImageUrl)}");\n}\n`;
};

const resolveSiteThemeDefinition = (site: SiteData) =>
  resolveThemeDefinition(themes[site.theme], {
    ...site.themeOverrides,
    cssVariables: site.cssVariables,
  });

const renderSiteCss = async (
  siteContent: SiteContentData,
  imagePipeline?: PreparedImagePipeline,
): Promise<string> => {
  const site = imagePipeline ? siteContent.site : rewriteLocalContentAssetsForSiteCss(siteContent.site);
  const pageBackgroundImageUrl =
    (siteContent.site.pageBackgroundImageUrl && imagePipeline
      ? imagePipeline.resolveStylesheetImageHref(siteContent.site.pageBackgroundImageUrl)
      : undefined) ??
    site.pageBackgroundImageUrl;
  const siteForTheme = {
    ...site,
    pageBackgroundImageUrl,
  };
  const resolvedTheme = resolveSiteThemeDefinition(siteForTheme);
  const usedComponentTypes = collectUsedComponentTypes(siteContent);
  const componentCssChunks = await Promise.all(
    componentDefinitions
      .filter((componentDefinition) => usedComponentTypes.has(componentDefinition.type))
      .map(async (componentDefinition) => {
        const css = await readFile(componentDefinition.cssPath, "utf8");
        return `/* ${componentDefinition.type} */\n${css}`;
      }),
  );

  const baseCss = await readFile(baseCssPath, "utf8");

  return [
    "/* site */",
    emitSiteCss(siteForTheme).trim(),
    "/* theme */",
    emitThemeCss(resolvedTheme),
    "/* base */",
    baseCss,
    ...componentCssChunks,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const collectUsedComponentTypes = (siteContent: SiteContentData): Set<ComponentType> => {
  const componentTypes = new Set<ComponentType>();

  siteContent.site.layout?.components.forEach((component) => {
    if (component.type !== "page-content") {
      componentTypes.add(component.type);
    }
  });

  siteContent.pages.forEach((page) => {
    page.components.forEach((component) => {
      componentTypes.add(component.type);
    });
  });

  return componentTypes;
};

const renderSiteJs = (siteContent: SiteContentData): string => {
  const usedComponentTypes = collectUsedComponentTypes(siteContent);

  return componentDefinitions
    .filter(
      (componentDefinition) =>
        usedComponentTypes.has(componentDefinition.type) && componentDefinition.scriptContent,
    )
    .map((componentDefinition) => {
      const scriptContent = componentDefinition.scriptContent;

      if (!scriptContent) {
        return "";
      }

      return `/* ${componentDefinition.type} */\n${scriptContent}`;
    })
    .filter(Boolean)
    .join("\n\n");
};

export interface BuildResult {
  pageCount: number;
  filesCreated: number;
  filesUpdated: number;
  filesUnchanged: number;
  filesRemoved: number;
}

export interface BuildOptions {
  contentPath?: string;
  preservePaths?: readonly string[];
}
const contentDirectoryName = "content";

const normalizeAssetPath = (assetPath: string): string =>
  assetPath.replaceAll("\\", "/").replace(/^[./]+/, "").replace(/^\/+/, "");

const stripUrlQueryAndHash = (assetPath: string): string => assetPath.split(/[?#]/u, 1)[0] ?? assetPath;

const extractUrlSuffix = (assetPath: string): string => {
  const strippedPath = stripUrlQueryAndHash(assetPath);
  return assetPath.slice(strippedPath.length);
};

const assetPathHasProtocol = (assetPath: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/iu.test(assetPath) || assetPath.startsWith("//");

const resolveContentRootRelativeAssetPath = (assetPath: string): string | undefined => {
  const strippedPath = stripUrlQueryAndHash(assetPath).trim();

  if (!strippedPath || assetPathHasProtocol(strippedPath)) {
    return undefined;
  }

  const normalizedAssetPath = normalizeAssetPath(strippedPath);

  if (!normalizedAssetPath) {
    return undefined;
  }

  if (normalizedAssetPath.startsWith(`${contentDirectoryName}/`)) {
    return normalizedAssetPath.slice(contentDirectoryName.length + 1);
  }

  if (strippedPath.startsWith("/")) {
    return undefined;
  }

  return normalizedAssetPath;
};

const isLocalContentAssetPath = (assetPath: string): boolean =>
  resolveContentRootRelativeAssetPath(assetPath) !== undefined;

const localContentAssetPathToCssHref = (assetPath: string): string => {
  const normalizedAssetPath = resolveContentRootRelativeAssetPath(assetPath);

  if (!normalizedAssetPath) {
    return assetPath;
  }
  const relativePath = path.posix.relative("/assets", `/${normalizedAssetPath}`);

  return `${relativePath || path.posix.basename(normalizedAssetPath)}${extractUrlSuffix(assetPath)}`;
};

const rewriteLocalContentAssetsForSiteCss = (site: SiteData): SiteData => {
  if (!site.pageBackgroundImageUrl || !isLocalContentAssetPath(site.pageBackgroundImageUrl)) {
    return site;
  }

  return {
    ...site,
    pageBackgroundImageUrl: localContentAssetPathToCssHref(site.pageBackgroundImageUrl),
  };
};

const collectFilesRecursively = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedPaths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectFilesRecursively(entryPath);
      }

      return entry.isFile() ? [entryPath] : [];
    }),
  );

  return nestedPaths.flat();
};

const writeFileIfChanged = async (
  filePath: string,
  contents: string,
): Promise<"created" | "updated" | "unchanged"> => {
  try {
    const existingContents = await readFile(filePath, "utf8");

    if (existingContents === contents) {
      return "unchanged";
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await writeFile(filePath, contents, "utf8");
    return "created";
  }

  await writeFile(filePath, contents, "utf8");
  return "updated";
};

const normalizeComparablePath = (filePath: string): string =>
  process.platform === "win32" ? path.resolve(filePath).toLowerCase() : path.resolve(filePath);

const isPathInsideOrEqual = (parentPath: string, childPath: string): boolean => {
  const relativePath = path.relative(
    normalizeComparablePath(parentPath),
    normalizeComparablePath(childPath),
  );

  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};

const resolvePreservedOutputPaths = (
  outDir: string,
  preservePaths: readonly string[] = [],
): string[] =>
  preservePaths.map((preservePath) =>
    path.resolve(path.isAbsolute(preservePath) ? preservePath : path.join(outDir, preservePath)),
  );

const isPreservedOutputPath = (
  filePath: string,
  preservedPaths: readonly string[],
): boolean => preservedPaths.some((preservedPath) => isPathInsideOrEqual(preservedPath, filePath));

const removeEmptyDirectories = async (
  directoryPath: string,
  rootDir: string,
  preservedPaths: readonly string[] = [],
): Promise<void> => {
  if (directoryPath !== rootDir && isPreservedOutputPath(directoryPath, preservedPaths)) {
    return;
  }

  const entries = await readdir(directoryPath, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) =>
        removeEmptyDirectories(path.join(directoryPath, entry.name), rootDir, preservedPaths),
      ),
  );

  if (directoryPath === rootDir) {
    return;
  }

  const remainingEntries = await readdir(directoryPath);
  if (remainingEntries.length === 0) {
    await rmdir(directoryPath);
  }
};

const removeStaleGeneratedFiles = async (
  outDir: string,
  expectedFiles: ReadonlySet<string>,
  preservedPaths: readonly string[] = [],
): Promise<number> => {
  try {
    const existingFiles = await collectFilesRecursively(outDir);
    const staleFiles = existingFiles.filter(
      (filePath) => !expectedFiles.has(filePath) && !isPreservedOutputPath(filePath, preservedPaths),
    );

    await Promise.all(staleFiles.map((filePath) => unlink(filePath)));
    await removeEmptyDirectories(outDir, outDir, preservedPaths);

    return staleFiles.length;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return 0;
    }

    throw error;
  }
};

export const buildSite = async (
  siteContent: SiteContentData,
  outDir: string = defaultOutDir,
  options: BuildOptions = {},
): Promise<BuildResult> => {
  const preservedPaths = resolvePreservedOutputPaths(outDir, options.preservePaths);

  await mkdir(path.join(outDir, "assets"), { recursive: true });

  const imagePipeline = options.contentPath
    ? await prepareImagePipeline(siteContent, options.contentPath, outDir)
    : undefined;
  const css = await renderSiteCss(siteContent, imagePipeline);
  const js = renderSiteJs(siteContent);
  const expectedFiles = new Set<string>();
  let filesCreated = 0;
  let filesUpdated = 0;
  let filesUnchanged = 0;

  const recordWriteResult = (writeResult: "created" | "updated" | "unchanged") => {
    if (writeResult === "created") {
      filesCreated += 1;
      return;
    }

    if (writeResult === "updated") {
      filesUpdated += 1;
      return;
    }

    filesUnchanged += 1;
  };

  const cssOutputPath = path.join(outDir, "assets", "site.css");
  expectedFiles.add(cssOutputPath);
  recordWriteResult(await writeFileIfChanged(cssOutputPath, css));

  if (js) {
    const jsOutputPath = path.join(outDir, "assets", "site.js");
    expectedFiles.add(jsOutputPath);
    recordWriteResult(await writeFileIfChanged(jsOutputPath, js));
  }

  imagePipeline?.expectedFiles.forEach((filePath) => {
    expectedFiles.add(filePath);
  });

  for (const [pageIndex, page] of siteContent.pages.entries()) {
    const renderContext = imagePipeline?.renderContextForPage(page.slug) ?? defaultComponentRenderContext;
    const bodyHtml = resolvePageComponents(siteContent.site, page, pageIndex)
      .map((component) => renderComponent(component, renderContext))
      .join("\n");
    const documentHtml = renderPageDocument({
      site: siteContent.site,
      page,
      bodyHtml,
      stylesheetHref: pageSlugToStylesheetHref(page.slug),
      scriptHref: js ? pageSlugToScriptHref(page.slug) : undefined,
    });
    const outputPath = pageSlugToOutputPath(page.slug, outDir);
    await mkdir(path.dirname(outputPath), { recursive: true });
    expectedFiles.add(outputPath);
    recordWriteResult(await writeFileIfChanged(outputPath, documentHtml));
  }

  const filesRemoved = await removeStaleGeneratedFiles(outDir, expectedFiles, preservedPaths);

  return {
    pageCount: siteContent.pages.length,
    filesCreated,
    filesUpdated,
    filesUnchanged,
    filesRemoved,
  };
};

export const buildSiteFromFile = async (
  contentPath: string = defaultContentPath,
  outDir: string = defaultOutDir,
): Promise<SiteContentData> => {
  const siteContent = await loadValidatedSite(contentPath);
  await buildSite(siteContent, outDir, { contentPath });
  return siteContent;
};
