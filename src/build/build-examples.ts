import { rm } from "node:fs/promises";
import path from "node:path";

import { themeNames } from "../themes/index.js";
import { ValidationFailure, buildSiteFromFile } from "./framework.js";

const examplesContentDir = path.resolve(process.cwd(), "content/examples/themes");
const examplesOutDir = path.resolve(process.cwd(), "dist/examples");

try {
  await rm(examplesOutDir, { recursive: true, force: true });

  let builtPages = 0;
  for (const themeName of themeNames) {
    const contentPath = path.join(examplesContentDir, `${themeName}.json`);
    const outDir = path.join(examplesOutDir, themeName);
    const siteContent = await buildSiteFromFile(contentPath, outDir);
    builtPages += siteContent.pages.length;
  }

  console.log(
    `Built ${themeNames.length} theme example site(s) with ${builtPages} page(s) into ${path.relative(process.cwd(), examplesOutDir)}`,
  );
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
