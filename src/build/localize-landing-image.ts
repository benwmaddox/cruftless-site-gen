import path from "node:path";

import { defaultContentPath } from "./framework.js";
import { writeLocalizedLandingImage } from "../discovery/landing-image-localization.js";
import { discoverRemotePageImages } from "../discovery/remote-page-image-discovery.js";

const args = process.argv.slice(2);
const candidateIndexFlagIndex = args.findIndex((arg) => arg === "--candidate-index");
const candidateIndexValue =
  candidateIndexFlagIndex >= 0 ? args[candidateIndexFlagIndex + 1] : undefined;
const positionalArgs = args.filter((arg, index) => {
  if (arg === "--candidate-index") {
    return false;
  }

  if (candidateIndexFlagIndex >= 0 && index === candidateIndexFlagIndex + 1) {
    return false;
  }

  return !arg.startsWith("--");
});

if (positionalArgs.length < 1 || positionalArgs.length > 2) {
  console.error(
    "Usage: tsx src/build/localize-landing-image.ts <page-url> [content-path] [--candidate-index <n>]",
  );
  process.exit(1);
}

const [pageUrlArg, contentArg] = positionalArgs;
const contentPath = contentArg ? path.resolve(process.cwd(), contentArg) : defaultContentPath;
const candidateIndex =
  candidateIndexValue !== undefined ? Number.parseInt(candidateIndexValue, 10) : 1;

if (!Number.isInteger(candidateIndex) || candidateIndex < 1) {
  console.error("--candidate-index must be a positive integer.");
  process.exit(1);
}

try {
  const discoveryResult = await discoverRemotePageImages(pageUrlArg);

  if (discoveryResult.candidates.length === 0) {
    throw new Error(`No image candidates found for ${discoveryResult.pageUrl}.`);
  }

  const selectedCandidate = discoveryResult.candidates[candidateIndex - 1];
  if (!selectedCandidate) {
    throw new Error(
      `Candidate index ${candidateIndex} is out of range. Found ${discoveryResult.candidates.length} candidates.`,
    );
  }

  const localizationResult = await writeLocalizedLandingImage(selectedCandidate.url, contentPath);

  console.log(`Localized landing image from ${localizationResult.downloadedFrom}`);
  console.log(`Saved to ${path.relative(process.cwd(), localizationResult.outputPath)}`);

  if (localizationResult.siteJsonUpdated) {
    console.log(
      `Updated ${localizationResult.updatedReferenceCount} site.json reference(s) to ${localizationResult.updatedReferencePath}`,
    );
  } else {
    console.log("No existing landing-page references were found in site.json; image was downloaded only.");
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
