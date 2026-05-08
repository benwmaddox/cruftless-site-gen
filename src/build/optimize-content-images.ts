import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { defaultContentPath } from "./framework.js";
import { resolveSiteTargetPaths } from "./site-target.js";

export interface OptimizeContentImagesOptions {
  contentPath?: string;
  dryRun?: boolean;
  keepOriginals?: boolean;
  minSavingsRatio?: number;
  quality?: number;
}

export interface OptimizedContentImage {
  inputPath: string;
  outputPath: string;
  originalBytes: number;
  optimizedBytes: number;
  referenceCount: number;
}

export interface SkippedContentImage {
  inputPath: string;
  reason: string;
}

export interface OptimizeContentImagesResult {
  optimized: OptimizedContentImage[];
  skipped: SkippedContentImage[];
  siteJsonUpdated: boolean;
}

const generatedPngPattern = /^generated-.+\.png$/iu;

const toContentHrefVariants = (contentPath: string, imagePath: string): string[] => {
  const projectRoot = path.dirname(path.dirname(contentPath));
  const contentDirectory = path.dirname(contentPath);
  const contentRelativePath = path.relative(contentDirectory, imagePath).replaceAll("\\", "/");
  const projectRelativePath = path.relative(projectRoot, imagePath).replaceAll("\\", "/");

  return [
    contentRelativePath,
    `./${contentRelativePath}`,
    `/${projectRelativePath}`,
    projectRelativePath,
  ];
};

const replaceStringValues = (
  value: unknown,
  replacements: ReadonlyMap<string, string>,
): { nextValue: unknown; replacementCount: number } => {
  if (typeof value === "string") {
    const replacement = replacements.get(value);
    return {
      nextValue: replacement ?? value,
      replacementCount: replacement ? 1 : 0,
    };
  }

  if (Array.isArray(value)) {
    let replacementCount = 0;
    const nextValue = value.map((item) => {
      const result = replaceStringValues(item, replacements);
      replacementCount += result.replacementCount;
      return result.nextValue;
    });

    return { nextValue, replacementCount };
  }

  if (typeof value === "object" && value !== null) {
    let replacementCount = 0;
    const nextValue: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      const result = replaceStringValues(item, replacements);
      replacementCount += result.replacementCount;
      nextValue[key] = result.nextValue;
    }

    return { nextValue, replacementCount };
  }

  return { nextValue: value, replacementCount: 0 };
};

const readSiteJson = async (contentPath: string): Promise<unknown> =>
  JSON.parse(await readFile(contentPath, "utf8")) as unknown;

const writeSiteJson = async (contentPath: string, value: unknown): Promise<void> => {
  await writeFile(contentPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const createReplacementPairs = (
  contentPath: string,
  inputPath: string,
  outputPath: string,
): Array<readonly [string, string]> => {
  const outputHrefVariants = toContentHrefVariants(contentPath, outputPath);

  return toContentHrefVariants(contentPath, inputPath).map(
    (inputHref, index) => [inputHref, outputHrefVariants[index] ?? outputHrefVariants[0]] as const,
  );
};

const readImageEntries = async (imagesDirectory: string) => {
  try {
    return await readdir(imagesDirectory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

export const optimizeContentImages = async (
  options: OptimizeContentImagesOptions = {},
): Promise<OptimizeContentImagesResult> => {
  const contentPath = path.resolve(process.cwd(), options.contentPath ?? defaultContentPath);
  const contentDirectory = path.dirname(contentPath);
  const imagesDirectory = path.join(contentDirectory, "images");
  const quality = options.quality ?? 86;
  const minSavingsRatio = options.minSavingsRatio ?? 0.05;
  const optimized: OptimizedContentImage[] = [];
  const skipped: SkippedContentImage[] = [];

  const imageEntries = await readImageEntries(imagesDirectory);
  const generatedPngPaths = imageEntries
    .filter((entry) => entry.isFile() && generatedPngPattern.test(entry.name))
    .map((entry) => path.join(imagesDirectory, entry.name))
    .sort();

  let siteJson = await readSiteJson(contentPath);
  let totalReferenceCount = 0;

  for (const inputPath of generatedPngPaths) {
    const outputPath = inputPath.replace(/\.png$/iu, ".webp");
    const replacementPairs = createReplacementPairs(contentPath, inputPath, outputPath);
    const replacements = new Map(replacementPairs);
    const replacementResult = replaceStringValues(siteJson, replacements);

    if (replacementResult.replacementCount === 0) {
      skipped.push({
        inputPath,
        reason: "no matching site.json references",
      });
      continue;
    }

    const inputBytes = await readFile(inputPath);
    const optimizedBytes = await sharp(inputBytes)
      .rotate()
      .webp({
        effort: 5,
        quality,
      })
      .toBuffer();
    const savingsRatio = 1 - optimizedBytes.length / inputBytes.length;

    if (savingsRatio < minSavingsRatio) {
      skipped.push({
        inputPath,
        reason: `optimized output saved ${(savingsRatio * 100).toFixed(1)}%, below ${(minSavingsRatio * 100).toFixed(1)}% threshold`,
      });
      continue;
    }

    optimized.push({
      inputPath,
      outputPath,
      originalBytes: inputBytes.length,
      optimizedBytes: optimizedBytes.length,
      referenceCount: replacementResult.replacementCount,
    });
    siteJson = replacementResult.nextValue;
    totalReferenceCount += replacementResult.replacementCount;

    if (!options.dryRun) {
      await writeFile(outputPath, optimizedBytes);
      if (!options.keepOriginals) {
        await rm(inputPath);
      }
    }
  }

  const siteJsonUpdated = totalReferenceCount > 0;
  if (siteJsonUpdated && !options.dryRun) {
    await writeSiteJson(contentPath, siteJson);
  }

  return {
    optimized,
    skipped,
    siteJsonUpdated,
  };
};

const parseArgs = (args: string[]): OptimizeContentImagesOptions => {
  let contentPath: string | undefined;
  let siteDir: string | undefined;
  const options: OptimizeContentImagesOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--keep-originals") {
      options.keepOriginals = true;
      continue;
    }

    if (arg === "--quality") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value after --quality");
      }
      options.quality = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg.startsWith("--quality=")) {
      options.quality = Number.parseInt(arg.slice("--quality=".length), 10);
      continue;
    }

    if (arg === "--site-dir" || arg === "--site") {
      siteDir = args[index + 1];
      if (!siteDir) {
        throw new Error(`Missing path after ${arg}`);
      }
      index += 1;
      continue;
    }

    if (arg.startsWith("--site-dir=")) {
      siteDir = arg.slice("--site-dir=".length);
      continue;
    }

    if (arg.startsWith("--site=")) {
      siteDir = arg.slice("--site=".length);
      continue;
    }

    if (!arg.startsWith("-") && !contentPath) {
      contentPath = arg;
      continue;
    }

    throw new Error(
      "Usage: tsx src/build/optimize-content-images.ts [content-path] [--site-dir site-directory] [--quality 86] [--dry-run] [--keep-originals]",
    );
  }

  if (
    options.quality !== undefined &&
    (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100)
  ) {
    throw new Error("--quality must be an integer from 1 to 100");
  }

  if (siteDir && contentPath) {
    throw new Error("Use either a content path or --site-dir, not both");
  }

  return {
    ...options,
    contentPath: siteDir ? resolveSiteTargetPaths(siteDir).contentPath : contentPath,
  };
};

const formatBytes = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    const result = await optimizeContentImages(parseArgs(process.argv.slice(2)));

    for (const image of result.optimized) {
      console.log(
        `${path.basename(image.inputPath)} -> ${path.basename(image.outputPath)} (${formatBytes(image.originalBytes)} -> ${formatBytes(image.optimizedBytes)}, ${image.referenceCount} reference(s))`,
      );
    }

    for (const image of result.skipped) {
      console.log(`Skipped ${path.basename(image.inputPath)}: ${image.reason}`);
    }

    if (result.optimized.length === 0) {
      console.log("No generated PNG images were optimized.");
    }

    if (result.siteJsonUpdated) {
      console.log("Updated content/site.json references.");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
