import { access, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import sharp from "sharp";

import type { ComponentData } from "../components/index.js";
import type {
  ComponentImageUsage,
  ComponentRenderContext,
  ResolvedImageData,
  ResponsiveImageData,
} from "../components/render-context.js";
import type { SiteContentData } from "../schemas/site.schema.js";

const rasterExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const svgExtension = ".svg";
const imagePipelineVersion = "v1";

const usageOutputWidths: Record<ComponentImageUsage, number> = {
  "before-after-panel": 960,
  "feature-grid-inline": 640,
  "feature-grid-stacked": 960,
  "gallery-full": 1920,
  "gallery-thumb-2": 720,
  "gallery-thumb-3": 560,
  "gallery-thumb-4": 420,
  "image-text": 1200,
  "page-background": 2400,
  "media-content": 1152,
  "media-wide": 1600,
  "navbar-brand": 320,
  "testimonial-avatar": 256,
};

const responsiveMediaOutputWidths: Record<"media-content" | "media-wide", number[]> = {
  "media-content": [480, 640, 960, 1152],
  "media-wide": [480, 640, 960, 1152],
};

const usageMinimumSourceWidths: Partial<Record<ComponentImageUsage, number>> = {
  "before-after-panel": 960,
  "feature-grid-inline": 640,
  "feature-grid-stacked": 960,
  "gallery-thumb-2": 720,
  "gallery-thumb-3": 560,
  "gallery-thumb-4": 420,
  "image-text": 1200,
  "media-content": 1152,
  "media-wide": 1600,
  "navbar-brand": 320,
  "testimonial-avatar": 256,
};

const galleryColumnUsage: Record<"2" | "3" | "4", ComponentImageUsage> = {
  "2": "gallery-thumb-2",
  "3": "gallery-thumb-3",
  "4": "gallery-thumb-4",
};

const createPreparedVariantKey = (
  sourceHref: string,
  usage: ComponentImageUsage,
  targetWidth: number,
): string => `${sourceHref}::${usage}::${targetWidth}`;

interface LocalImageSource {
  sourcePath: string;
  sourceProjectRelativePath: string;
  sourceHref: string;
}

interface ImageSourceMetadata {
  extension: string;
  format: string;
  height?: number;
  isLocal: boolean;
  isRaster: boolean;
  isSvg: boolean;
  sourcePath?: string;
  width?: number;
}

interface ImageReferenceUsage {
  columns?: "2" | "3" | "4";
  sourceHref: string;
  usage: ComponentImageUsage;
}

interface PreparedVariant {
  height?: number;
  href: string;
  outputPath: string;
  width?: number;
}

interface ImageBuildIssue {
  message: string;
  path: Array<string | number>;
}

const metadataCache = new Map<string, { metadata: ImageSourceMetadata; mtimeMs: number }>();

const isRemoteAssetHref = (href: string): boolean => /^[a-z]+:/iu.test(href) || href.startsWith("//");

const normalizeProjectRelativePath = (filePath: string, projectRoot: string): string =>
  path.relative(projectRoot, filePath).replaceAll("\\", "/");

const findProjectRootFromContentPath = (contentPath: string): string => {
  const contentPathSegments = path.resolve(contentPath).split(path.sep);
  const contentDirIndex = contentPathSegments.lastIndexOf("content");

  if (contentDirIndex <= 0) {
    return process.cwd();
  }

  return contentPathSegments.slice(0, contentDirIndex).join(path.sep) || path.parse(contentPath).root;
};

const resolveLocalImageSource = (
  assetHref: string,
  contentPath: string,
): LocalImageSource | undefined => {
  const normalizedHref = assetHref.replaceAll("\\", "/");
  const normalizedContentHref = normalizedHref.startsWith("/content/")
    ? normalizedHref.slice(1)
    : normalizedHref;

  if (
    isRemoteAssetHref(assetHref) ||
    (path.isAbsolute(assetHref) && !normalizedContentHref.startsWith("content/")) ||
    normalizedHref.startsWith("assets/")
  ) {
    return undefined;
  }

  const projectRoot = findProjectRootFromContentPath(contentPath);
  const contentDirectory = path.dirname(contentPath);
  const candidatePath = normalizedContentHref.startsWith("content/")
    ? path.resolve(projectRoot, ...normalizedContentHref.split("/"))
    : path.resolve(contentDirectory, assetHref);
  const projectRelativePath = normalizeProjectRelativePath(candidatePath, projectRoot);

  if (projectRelativePath.startsWith("../") || projectRelativePath === "..") {
    return undefined;
  }

  return {
    sourcePath: candidatePath,
    sourceProjectRelativePath: projectRelativePath,
    sourceHref: assetHref,
  };
};

const readLocalImageMetadata = async (source: LocalImageSource): Promise<ImageSourceMetadata> => {
  const sourceStats = await stat(source.sourcePath);
  const cached = metadataCache.get(source.sourcePath);

  if (cached && cached.mtimeMs === sourceStats.mtimeMs) {
    return cached.metadata;
  }

  const extension = path.extname(source.sourcePath).toLowerCase();

  if (extension === svgExtension) {
    const svgMetadata = await sharp(source.sourcePath).metadata();
    const metadata: ImageSourceMetadata = {
      extension,
      format: svgMetadata.format ?? "svg",
      height: svgMetadata.height,
      isLocal: true,
      isRaster: false,
      isSvg: true,
      sourcePath: source.sourcePath,
      width: svgMetadata.width,
    };

    metadataCache.set(source.sourcePath, { metadata, mtimeMs: sourceStats.mtimeMs });
    return metadata;
  }

  if (!rasterExtensions.has(extension)) {
    const metadata: ImageSourceMetadata = {
      extension,
      format: extension.replace(/^\./u, ""),
      isLocal: true,
      isRaster: false,
      isSvg: false,
      sourcePath: source.sourcePath,
    };

    metadataCache.set(source.sourcePath, { metadata, mtimeMs: sourceStats.mtimeMs });
    return metadata;
  }

  const imageMetadata = await sharp(source.sourcePath).metadata();
  const metadata: ImageSourceMetadata = {
    extension,
    format: imageMetadata.format ?? extension.replace(/^\./u, ""),
    height: imageMetadata.height,
    isLocal: true,
    isRaster: true,
    isSvg: false,
    sourcePath: source.sourcePath,
    width: imageMetadata.width,
  };

  metadataCache.set(source.sourcePath, { metadata, mtimeMs: sourceStats.mtimeMs });
  return metadata;
};

const writeBufferIfChanged = async (
  outputPath: string,
  contents: Buffer,
): Promise<"created" | "updated" | "unchanged"> => {
  try {
    const existingContents = await readFile(outputPath);

    if (existingContents.equals(contents)) {
      return "unchanged";
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await writeFile(outputPath, contents);
    return "created";
  }

  await writeFile(outputPath, contents);
  return "updated";
};

const collectImageUsages = (
  siteContent: SiteContentData,
): Array<{ path: Array<string | number>; usage: ImageReferenceUsage }> => {
  const usages: Array<{ path: Array<string | number>; usage: ImageReferenceUsage }> = [];

  const addUsage = (
    pathSegments: Array<string | number>,
    sourceHref: string,
    usage: ComponentImageUsage,
    columns?: "2" | "3" | "4",
  ) => {
    usages.push({
      path: pathSegments,
      usage: {
        columns,
        sourceHref,
        usage,
      },
    });
  };

  const visitComponent = (
    component: ComponentData,
    pathSegments: Array<string | number>,
  ) => {
    switch (component.type) {
      case "before-after":
        addUsage([...pathSegments, "before"], component.before.src, "before-after-panel");
        addUsage([...pathSegments, "after"], component.after.src, "before-after-panel");
        return;
      case "feature-grid":
        component.items.forEach((item, itemIndex) => {
          if (!item.image) {
            return;
          }

          addUsage(
            [...pathSegments, "items", itemIndex, "image"],
            item.image.src,
            item.imageLayout === "stacked" ? "feature-grid-stacked" : "feature-grid-inline",
          );
        });
        return;
      case "gallery":
        component.images.forEach((image, imageIndex) => {
          addUsage(
            [...pathSegments, "images", imageIndex],
            image.src,
            galleryColumnUsage[component.columns],
            component.columns,
          );
          addUsage([...pathSegments, "images", imageIndex], image.src, "gallery-full");
        });
        return;
      case "image-text":
        addUsage([...pathSegments, "image"], component.image.src, "image-text");
        return;
      case "logo-strip":
        component.logos.forEach((logo, logoIndex) => {
          addUsage([...pathSegments, "logos", logoIndex], logo.src, "navbar-brand");
        });
        return;
      case "media":
        addUsage(pathSegments, component.src, component.size === "content" ? "media-content" : "media-wide");
        return;
      case "navigation-bar":
        if (component.brandImage) {
          addUsage([...pathSegments, "brandImage"], component.brandImage.src, "navbar-brand");
        }
        return;
      case "testimonials":
        component.items.forEach((item, itemIndex) => {
          if (!item.image) {
            return;
          }

          addUsage([...pathSegments, "items", itemIndex, "image"], item.image.src, "testimonial-avatar");
        });
        return;
      default:
        return;
    }
  };

  if (siteContent.site.pageBackgroundImageUrl) {
    addUsage(["site", "pageBackgroundImageUrl"], siteContent.site.pageBackgroundImageUrl, "page-background");
  }

  siteContent.site.layout?.components.forEach((component, componentIndex) => {
    if (component.type === "page-content") {
      return;
    }

    visitComponent(component, ["site", "layout", "components", componentIndex]);
  });

  siteContent.pages.forEach((page, pageIndex) => {
    page.components.forEach((component, componentIndex) => {
      visitComponent(component, ["pages", pageIndex, "components", componentIndex]);
    });
  });

  return usages;
};

const resolveOutputExtension = (extension: string, usage: ComponentImageUsage): string => {
  if (usage === "page-background" || usage === "media-content" || usage === "media-wide") {
    return ".avif";
  }

  if (extension === ".jpeg") {
    return ".jpg";
  }

  return extension;
};

const createOutputRelativePath = (
  source: LocalImageSource,
  sourceMtimeMs: number,
  usage: ComponentImageUsage,
  targetWidth: number,
  extension: string,
): string => {
  const fileHash = createHash("sha1")
    .update(imagePipelineVersion)
    .update(source.sourceProjectRelativePath)
    .update(String(sourceMtimeMs))
    .update(usage)
    .update(String(targetWidth))
    .digest("hex")
    .slice(0, 12);
  const fileName = `${path.basename(source.sourceProjectRelativePath, path.extname(source.sourceProjectRelativePath))}-${usage}-${targetWidth}-${fileHash}${resolveOutputExtension(extension, usage)}`;

  return path.posix.join("assets", "images", fileName);
};

const createOutputHref = (pageSlug: string, outputRelativePath: string): string => {
  const pagePath = pageSlug === "/" ? "/index.html" : path.posix.join(pageSlug, "index.html");
  return path.posix.relative(path.posix.dirname(pagePath), `/${outputRelativePath}`);
};

const createStylesheetHref = (outputRelativePath: string): string =>
  path.posix.relative("/assets", `/${outputRelativePath}`);

const resolveVariantDimensions = (
  sourceWidth: number | undefined,
  sourceHeight: number | undefined,
  maxWidth: number,
): { height?: number; width?: number } => {
  if (sourceWidth === undefined || sourceHeight === undefined) {
    return {};
  }

  const width = Math.min(sourceWidth, maxWidth);
  const height = Math.round((sourceHeight * width) / sourceWidth);

  return {
    height,
    width,
  };
};

const processLocalImageVariant = async (
  source: LocalImageSource,
  metadata: ImageSourceMetadata,
  usage: ComponentImageUsage,
  targetWidth: number,
  outDir: string,
): Promise<PreparedVariant> => {
  const sourceStats = await stat(source.sourcePath);
  const outputRelativePath = createOutputRelativePath(
    source,
    sourceStats.mtimeMs,
    usage,
    targetWidth,
    metadata.extension,
  );
  const outputPath = path.join(outDir, ...outputRelativePath.split("/"));

  try {
    await access(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await mkdir(path.dirname(outputPath), { recursive: true });

    if (metadata.isSvg) {
      await copyFile(source.sourcePath, outputPath);
    } else if (metadata.isRaster) {
      const transformer = sharp(source.sourcePath).rotate();
      const resized = await (usage === "page-background"
        ? transformer
            .resize({
              fit: "inside",
              width: targetWidth,
              withoutEnlargement: true,
            })
            .avif({
              effort: 4,
              quality: 62,
            })
            .toBuffer()
        : usage === "media-content" || usage === "media-wide"
          ? transformer
              .resize({
                fit: "inside",
                width: targetWidth,
                withoutEnlargement: true,
              })
              .avif({
                effort: 4,
                quality: 45,
              })
              .toBuffer()
        : transformer
            .resize({
              fit: "inside",
              width: targetWidth,
              withoutEnlargement: true,
            })
            .toBuffer());
      await writeBufferIfChanged(outputPath, resized);
    } else {
      await copyFile(source.sourcePath, outputPath);
    }
  }

  const variantDimensions =
    metadata.isRaster
      ? resolveVariantDimensions(metadata.width, metadata.height, targetWidth)
      : {
          height: metadata.height,
          width: metadata.width,
        };

  return {
    height: variantDimensions.height,
    href: outputRelativePath,
    outputPath,
    width: variantDimensions.width,
  };
};

const validateLocalImageUsage = async (
  usageEntry: { path: Array<string | number>; usage: ImageReferenceUsage },
  contentPath: string,
  accumulatedRequirements: Map<string, number>,
): Promise<ImageBuildIssue[]> => {
  const localSource = resolveLocalImageSource(usageEntry.usage.sourceHref, contentPath);

  if (!localSource) {
    return [];
  }

  const issues: ImageBuildIssue[] = [];
  let metadata: ImageSourceMetadata;

  try {
    metadata = await readLocalImageMetadata(localSource);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      issues.push({
        message: `local image does not exist at '${localSource.sourceHref}'`,
        path: usageEntry.path,
      });
      return issues;
    }

    throw error;
  }

  if (!metadata.isSvg && !metadata.isRaster) {
    issues.push({
      message: `unsupported local image format '${metadata.extension || path.extname(localSource.sourcePath)}'`,
      path: usageEntry.path,
    });
    return issues;
  }

  const requiredWidth = usageMinimumSourceWidths[usageEntry.usage.usage];
  if (requiredWidth === undefined) {
    return issues;
  }

  const previousRequirement = accumulatedRequirements.get(localSource.sourcePath) ?? 0;
  accumulatedRequirements.set(localSource.sourcePath, Math.max(previousRequirement, requiredWidth));

  if (metadata.isRaster && metadata.width !== undefined && metadata.width < requiredWidth) {
    issues.push({
      message: `source image width ${metadata.width}px is smaller than required ${requiredWidth}px for ${usageEntry.usage.usage}`,
      path: usageEntry.path,
    });
  }

  return issues;
};

export const collectWatchableLocalImagePaths = (
  siteContent: SiteContentData,
  contentPath: string,
): string[] =>
  Array.from(
    new Set(
      collectImageUsages(siteContent)
        .map((entry) => resolveLocalImageSource(entry.usage.sourceHref, contentPath)?.sourcePath)
        .filter((sourcePath): sourcePath is string => sourcePath !== undefined),
    ),
  ).sort();

export const collectImageValidationIssues = async (
  siteContent: SiteContentData,
  contentPath: string,
): Promise<ImageBuildIssue[]> => {
  const requirements = new Map<string, number>();
  const issues = await Promise.all(
    collectImageUsages(siteContent).map((usageEntry) =>
      validateLocalImageUsage(usageEntry, contentPath, requirements),
    ),
  );

  return issues.flat();
};

export interface PreparedImagePipeline {
  expectedFiles: Set<string>;
  resolveStylesheetImageHref: (sourceHref: string) => string;
  renderContextForPage: (pageSlug: string) => ComponentRenderContext;
}

export const prepareImagePipeline = async (
  siteContent: SiteContentData,
  contentPath: string,
  outDir: string,
): Promise<PreparedImagePipeline> => {
  const usages = collectImageUsages(siteContent);
  const expectedFiles = new Set<string>();
  const preparedVariants = new Map<string, PreparedVariant>();

  const getUsageTargetWidths = (usage: ComponentImageUsage): number[] => {
    if (usage === "media-content" || usage === "media-wide") {
      return responsiveMediaOutputWidths[usage];
    }

    return [usageOutputWidths[usage]];
  };

  for (const usageEntry of usages) {
    const localSource = resolveLocalImageSource(usageEntry.usage.sourceHref, contentPath);

    if (!localSource) {
      continue;
    }

    const metadata = await readLocalImageMetadata(localSource);

    for (const targetWidth of getUsageTargetWidths(usageEntry.usage.usage)) {
      const variantKey = createPreparedVariantKey(
        usageEntry.usage.sourceHref,
        usageEntry.usage.usage,
        targetWidth,
      );

      if (!preparedVariants.has(variantKey)) {
        const variant = await processLocalImageVariant(
          localSource,
          metadata,
          usageEntry.usage.usage,
          targetWidth,
          outDir,
        );
        expectedFiles.add(variant.outputPath);
        preparedVariants.set(variantKey, variant);
      }
    }
  }

  const resolvePreparedVariant = (
    image: { height?: number; src: string; width?: number },
    usage: ComponentImageUsage,
    targetWidth: number,
  ): ResolvedImageData => {
    const preparedVariant = preparedVariants.get(createPreparedVariantKey(image.src, usage, targetWidth));

    if (!preparedVariant) {
      return {
        src: image.src,
        width: image.width,
        height: image.height,
      };
    }

    return {
      src: preparedVariant.href,
      width: preparedVariant.width,
      height: preparedVariant.height,
    };
  };

  return {
    expectedFiles,
    resolveStylesheetImageHref: (sourceHref) => {
      const preparedVariant = preparedVariants.get(
        createPreparedVariantKey(sourceHref, "page-background", usageOutputWidths["page-background"]),
      );

      if (!preparedVariant) {
        return sourceHref;
      }

      return createStylesheetHref(preparedVariant.href);
    },
    renderContextForPage: (pageSlug) => ({
      resolveImage: (image, usage) => {
        const usageTargetWidths = getUsageTargetWidths(usage);
        const baseTargetWidth = usageTargetWidths[usageTargetWidths.length - 1];
        const resolved = resolvePreparedVariant(image, usage, baseTargetWidth);

        return {
          ...resolved,
          src: preparedVariants.has(createPreparedVariantKey(image.src, usage, baseTargetWidth))
            ? createOutputHref(pageSlug, resolved.src)
            : resolved.src,
        };
      },
      resolveGalleryImage: (image, columns) => {
        const thumbnailUsage = galleryColumnUsage[columns];
        const thumbnailWidth = usageOutputWidths[thumbnailUsage];
        const fullWidth = usageOutputWidths["gallery-full"];
        const thumbnail = resolvePreparedVariant(image, thumbnailUsage, thumbnailWidth);
        const full = resolvePreparedVariant(image, "gallery-full", fullWidth);

        return {
          src: preparedVariants.has(createPreparedVariantKey(image.src, thumbnailUsage, thumbnailWidth))
            ? createOutputHref(pageSlug, thumbnail.src)
            : thumbnail.src,
          width: thumbnail.width,
          height: thumbnail.height,
          fullSrc: preparedVariants.has(createPreparedVariantKey(image.src, "gallery-full", fullWidth))
            ? createOutputHref(pageSlug, full.src)
            : full.src,
          fullWidth: full.width,
          fullHeight: full.height,
        };
      },
      resolveResponsiveImage: (image, usage) => {
        const targetWidths = responsiveMediaOutputWidths[usage];

        if (!targetWidths) {
          return undefined;
        }

        const variants = targetWidths
          .map((targetWidth) => {
            const resolved = resolvePreparedVariant(image, usage, targetWidth);

            return {
              ...resolved,
              src: preparedVariants.has(createPreparedVariantKey(image.src, usage, targetWidth))
                ? createOutputHref(pageSlug, resolved.src)
                : resolved.src,
            };
          })
          .filter((variant) => variant.width !== undefined && variant.height !== undefined);

        if (variants.length === 0) {
          return undefined;
        }

        const srcset = variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
        const largest = variants[variants.length - 1];
        const sizes =
          usage === "media-content"
            ? "(min-width: 1312px) 1280px, calc(100vw - 3rem)"
            : "(min-width: 1184px) 1152px, calc(100vw - 3rem)";

        return {
          src: largest.src,
          width: largest.width,
          height: largest.height,
          srcset,
          sizes,
        };
      },
    }),
  };
};
