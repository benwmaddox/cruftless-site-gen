import path from "node:path";

import { ValidationFailure, defaultContentPath, loadValidatedSite } from "./framework.js";
import { resolveSiteTargetPaths } from "./site-target.js";

const args = process.argv.slice(2);
let siteDirArg: string | undefined;
const positionalArgs: string[] = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--site-dir" || arg === "--site") {
    const sitePath = args[index + 1];
    if (!sitePath) {
      throw new Error(`Missing path after ${arg}`);
    }

    siteDirArg = sitePath;
    index += 1;
    continue;
  }

  if (arg.startsWith("--site-dir=")) {
    const sitePath = arg.slice("--site-dir=".length);
    if (!sitePath) {
      throw new Error("Missing path after --site-dir");
    }

    siteDirArg = sitePath;
    continue;
  }

  if (arg.startsWith("--site=")) {
    const sitePath = arg.slice("--site=".length);
    if (!sitePath) {
      throw new Error("Missing path after --site");
    }

    siteDirArg = sitePath;
    continue;
  }

  positionalArgs.push(arg);
}

if (positionalArgs.length > 1 || (siteDirArg && positionalArgs.length > 0)) {
  throw new Error("Usage: tsx src/build/validate.ts [content-path] or tsx src/build/validate.ts --site-dir site-directory");
}

const [contentArg] = positionalArgs;
const siteTarget = siteDirArg ? resolveSiteTargetPaths(siteDirArg) : undefined;
const contentPath =
  siteTarget?.contentPath ?? (contentArg ? path.resolve(process.cwd(), contentArg) : defaultContentPath);

try {
  const siteContent = await loadValidatedSite(contentPath);
  console.log(
    `Validated ${siteContent.pages.length} page(s) from ${path.relative(process.cwd(), contentPath)}`,
  );
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
