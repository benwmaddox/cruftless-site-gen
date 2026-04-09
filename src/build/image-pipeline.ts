import { access, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import sharp from "sharp";

import type { ComponentData } from "../components/index.js";
import type {
  ComponentImageUsage,
  ComponentRenderContext,
  ResolvedImageData,
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
  "media-content": 1280,
  "media-wide": 1600,
  "navbar-brand": 320,
  "testimonial-avatar": 256,
};

const usageMinimumSourceWidths: Partial<Record<ComponentImageUsage, number>> = {
  "before-after-panel": 960,
  "feature-grid-inline": 640,
  "feature-grid-stacked": 960,
  "gallery-thumb-2": 720,
  "gallery-thumb-3": 560,
  "gallery-thumb-4": 420,
  "image-text": 1200,
  "media-content": 1280,
  "media-wide": 1600,
  "navbar-brand": 320,
  "testimonial-avatar": 256,
};

const galleryColumnUsage: Record<"2" | "3" | "4", ComponentImageUsage> = {
  "2": "gallery-thumb-2",
  "3": "gallery-thumb-3",
  "4": "gallery-thumb-4",
};

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

const isPassthroughLocalAssetHref = (href: string): boolean => {
  const normalizedHref = href.trim().replaceAll("\\", "/");

  return (
    normalizedHref.length > 0 &&
    !isRemoteAssetHref(normalizedHref) &&
    !path.isAbsolute(normalizedHref) &&
    !normalizedHref.startsWith("assets/")
  );
};

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

  if (
    isRemoteAssetHref(assetHref) ||
    path.isAbsolute(assetHref) ||
    normalizedHref.startsWith("assets/")
  ) {
    return undefined;
  }

  const projectRoot = findProjectRootFromContentPath(contentPath);
  const contentDirectory = path.dirname(contentPath);
  const candidatePath = normalizedHref.startsWith("content/")
    ? path.resolve(projectRoot, ...normalizedHref.split("/"))
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

const resolveOutputExtension = (extension: string): string => {
  if (extension === ".jpeg") {
    return ".jpg";
  }

  return extension;
};

const createOutputRelativePath = (
  source: LocalImageSource,
  sourceMtimeMs: number,
  usage: ComponentImageUsage,
  extension: string,
): string => {
  const fileHash = createHash("sha1")
    .update(imagePipelineVersion)
    .update(source.sourceProjectRelativePath)
    .update(String(sourceMtimeMs))
    .update(usage)
    .update(String(usageOutputWidths[usage]))
    .digest("hex")
    .slice(0, 12);
  const fileName = `${path.basename(source.sourceProjectRelativePath, path.extname(source.sourceProjectRelativePath))}-${usage}-${fileHash}${resolveOutputExtension(extension)}`;

  return path.posix.join("assets", "images", fileName);
};

const createOutputHref = (pageSlug: string, outputRelativePath: string): string => {
  const pagePath = pageSlug === "/" ? "/index.html" : path.posix.join(pageSlug, "index.html");
  return path.posix.relative(path.posix.dirname(pagePath), `/${outputRelativePath}`);
};

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
  outDir: string,
): Promise<PreparedVariant> => {
  const sourceStats = await stat(source.sourcePath);
  const outputRelativePath = createOutputRelativePath(
    source,
    sourceStats.mtimeMs,
    usage,
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
      const targetWidth = usageOutputWidths[usage];
      const transformer = sharp(source.sourcePath).rotate();
      const resized = await transformer
        .resize({
          fit: "inside",
          width: targetWidth,
          withoutEnlargement: true,
        })
        .toBuffer();
      await writeBufferIfChanged(outputPath, resized);
    } else {
      await copyFile(source.sourcePath, outputPath);
    }
  }

  const variantDimensions =
    metadata.isRaster
      ? resolveVariantDimensions(metadata.width, metadata.height, usageOutputWidths[usage])
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

  for (const usageEntry of usages) {
    if (isPassthroughLocalAssetHref(usageEntry.usage.sourceHref)) {
      continue;
    }

    const localSource = resolveLocalImageSource(usageEntry.usage.sourceHref, contentPath);

    if (!localSource) {
      continue;
    }

    const metadata = await readLocalImageMetadata(localSource);
    const variantKey = `${usageEntry.usage.sourceHref}::${usageEntry.usage.usage}`;

    if (!preparedVariants.has(variantKey)) {
      const variant = await processLocalImageVariant(localSource, metadata, usageEntry.usage.usage, outDir);
      expectedFiles.add(variant.outputPath);
      preparedVariants.set(variantKey, variant);
    }
  }

  const resolvePreparedVariant = (
    image: { height?: number; src: string; width?: number },
    usage: ComponentImageUsage,
  ): ResolvedImageData => {
    const preparedVariant = preparedVariants.get(`${image.src}::${usage}`);

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
    renderContextForPage: (pageSlug) => ({
      resolveImage: (image, usage) => {
        const resolved = resolvePreparedVariant(image, usage);

        return {
          ...resolved,
          src: preparedVariants.has(`${image.src}::${usage}`)
            ? createOutputHref(pageSlug, resolved.src)
            : resolved.src,
        };
      },
      resolveGalleryImage: (image, columns) => {
        const thumbnailUsage = galleryColumnUsage[columns];
        const thumbnail = resolvePreparedVariant(image, thumbnailUsage);
        const full = resolvePreparedVariant(image, "gallery-full");

        return {
          src: preparedVariants.has(`${image.src}::${thumbnailUsage}`)
            ? createOutputHref(pageSlug, thumbnail.src)
            : thumbnail.src,
          width: thumbnail.width,
          height: thumbnail.height,
          fullSrc: preparedVariants.has(`${image.src}::gallery-full`)
            ? createOutputHref(pageSlug, full.src)
            : full.src,
          fullWidth: full.width,
          fullHeight: full.height,
        };
      },
    }),
  };
};
