import path from "node:path";

import { themeNames } from "../themes/index.js";
import { ValidationFailure, loadValidatedSite } from "./framework.js";

const examplesContentDir = path.resolve(process.cwd(), "content/examples/themes");

try {
  let totalPages = 0;
  for (const themeName of themeNames) {
    const contentPath = path.join(examplesContentDir, `${themeName}.json`);
    const siteContent = await loadValidatedSite(contentPath);
    totalPages += siteContent.pages.length;
  }

  console.log(
    `Validated ${themeNames.length} theme example site(s) with ${totalPages} page(s) from ${path.relative(process.cwd(), examplesContentDir)}`,
  );
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
