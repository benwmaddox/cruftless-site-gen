import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const landingImageReferencePattern = /^\/content\/images\/landing-page\.[a-z0-9]+$/i;
const knownImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

const imageContentTypeToExtension = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
  ["image/avif", ".avif"],
]);

export interface LandingImageLocalizationResult {
  downloadedFrom: string;
  outputPath: string;
  siteJsonUpdated: boolean;
  updatedReferencePath: string;
  updatedReferenceCount: number;
}

const stripUtf8Bom = (value: string): string => value.replace(/^\uFEFF/, "");

export const inferImageExtension = (
  imageUrl: string,
  contentType: string | null,
): string => {
  const normalizedContentType = contentType?.split(";")[0].trim().toLowerCase() ?? "";
  const mappedExtension = imageContentTypeToExtension.get(normalizedContentType);

  if (mappedExtension) {
    return mappedExtension;
  }

  const pathname = new URL(imageUrl).pathname;
  const parsedExtension = path.posix.extname(pathname).toLowerCase();

  if (knownImageExtensions.has(parsedExtension)) {
    return parsedExtension;
  }

  return ".jpg";
};

export const replaceLandingImageReferences = (
  value: unknown,
  nextReferencePath: string,
): { value: unknown; updatedReferenceCount: number } => {
  if (typeof value === "string") {
    if (landingImageReferencePattern.test(value)) {
      return {
        value: nextReferencePath,
        updatedReferenceCount: 1,
      };
    }

    return {
      value,
      updatedReferenceCount: 0,
    };
  }

  if (Array.isArray(value)) {
    const rewrittenEntries = value.map((entry) =>
      replaceLandingImageReferences(entry, nextReferencePath),
    );

    return {
      value: rewrittenEntries.map((entry) => entry.value),
      updatedReferenceCount: rewrittenEntries.reduce(
        (count, entry) => count + entry.updatedReferenceCount,
        0,
      ),
    };
  }

  if (typeof value === "object" && value !== null) {
    const rewrittenEntries = Object.entries(value).map(([key, entryValue]) => [
      key,
      replaceLandingImageReferences(entryValue, nextReferencePath),
    ] as const);

    return {
      value: Object.fromEntries(rewrittenEntries.map(([key, entry]) => [key, entry.value])),
      updatedReferenceCount: rewrittenEntries.reduce(
        (count, [, entry]) => count + entry.updatedReferenceCount,
        0,
      ),
    };
  }

  return {
    value,
    updatedReferenceCount: 0,
  };
};

const removeStaleLandingImages = async (
  imagesDirectory: string,
  nextFilename: string,
): Promise<void> => {
  try {
    const entries = await readdir(imagesDirectory, { withFileTypes: true });

    await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isFile() &&
            entry.name.startsWith("landing-page.") &&
            entry.name !== nextFilename,
        )
        .map((entry) => rm(path.join(imagesDirectory, entry.name), { force: true })),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
};

export const writeLocalizedLandingImage = async (
  imageUrl: string,
  contentPath: string,
): Promise<LandingImageLocalizationResult> => {
  const originalSiteJson = stripUtf8Bom(await readFile(contentPath, "utf8"));
  const parsedSiteJson = JSON.parse(originalSiteJson) as unknown;

  const response = await fetch(imageUrl, {
    headers: {
      "user-agent": "cruftless-site-gen landing image localizer",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${imageUrl}: ${response.status} ${response.statusText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const extension = inferImageExtension(imageUrl, response.headers.get("content-type"));
  const imagesDirectory = path.join(path.dirname(contentPath), "images");
  const filename = `landing-page${extension}`;
  const outputPath = path.join(imagesDirectory, filename);
  const updatedReferencePath = `/content/images/${filename}`;
  const rewrittenSiteJson = replaceLandingImageReferences(parsedSiteJson, updatedReferencePath);

  await mkdir(imagesDirectory, { recursive: true });
  await removeStaleLandingImages(imagesDirectory, filename);
  await writeFile(outputPath, imageBuffer);

  if (rewrittenSiteJson.updatedReferenceCount > 0) {
    await writeFile(contentPath, `${JSON.stringify(rewrittenSiteJson.value, null, 2)}\n`, "utf8");
  }

  return {
    downloadedFrom: imageUrl,
    outputPath,
    siteJsonUpdated: rewrittenSiteJson.updatedReferenceCount > 0,
    updatedReferencePath,
    updatedReferenceCount: rewrittenSiteJson.updatedReferenceCount,
  };
};
