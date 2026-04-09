import type { ImageCandidate } from "../discovery/page-image-discovery.js";
import { discoverRemotePageImages } from "../discovery/remote-page-image-discovery.js";

const [, , pageUrlArg, ...flagArgs] = process.argv;

if (!pageUrlArg) {
  console.error("Usage: tsx src/build/discover-page-images.ts <page-url> [--json]");
  process.exit(1);
}

const outputJson = flagArgs.includes("--json");

const formatCandidate = (candidate: ImageCandidate, index: number): string => {
  const sameOriginLabel = candidate.sameOrigin ? "same-origin" : "off-origin";
  return `${index + 1}. [${candidate.score}] ${candidate.source} (${sameOriginLabel})\n   ${candidate.url}`;
};

try {
  const discoveryResult = await discoverRemotePageImages(pageUrlArg);
  const { pageUrl, stylesheetUrls, candidates } = discoveryResult;

  if (outputJson) {
    console.log(JSON.stringify({ pageUrl, stylesheetUrls, candidates }, null, 2));
  } else {
    console.log(`Image candidates for ${pageUrl}`);
    console.log(`Stylesheets checked: ${stylesheetUrls.length}`);

    if (candidates.length === 0) {
      console.log("No image candidates found.");
      process.exit(0);
    }

    candidates.forEach((candidate, index) => {
      console.log(formatCandidate(candidate, index));
    });
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
