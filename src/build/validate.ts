import path from "node:path";

import { ValidationFailure, defaultContentPath, loadValidatedSite } from "./framework.js";

const [, , contentArg] = process.argv;
const contentPath = contentArg ? path.resolve(process.cwd(), contentArg) : defaultContentPath;

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

