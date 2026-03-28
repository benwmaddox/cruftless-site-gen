import path from "node:path";

import {
  ValidationFailure,
  buildSiteFromFile,
  defaultContentPath,
  defaultOutDir,
} from "./framework.js";

const [, , contentArg, outArg] = process.argv;
const contentPath = contentArg ? path.resolve(process.cwd(), contentArg) : defaultContentPath;
const outDir = outArg ? path.resolve(process.cwd(), outArg) : defaultOutDir;

try {
  const siteContent = await buildSiteFromFile(contentPath, outDir);
  console.log(
    `Built ${siteContent.pages.length} page(s) into ${path.relative(process.cwd(), outDir)}`,
  );
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}

