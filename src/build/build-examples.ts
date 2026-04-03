import path from "node:path";

import { themeNames } from "../themes/index.js";
import {
  ValidationFailure,
  buildThemeExamples,
  examplesOutDir,
} from "./theme-example-previews.js";

try {
  const { builtPages, previewCount } = await buildThemeExamples();

  console.log(
    `Built the theme preview index plus ${themeNames.length} theme example site(s) with ${builtPages} page(s) and ${previewCount} real screenshot preview(s) into ${path.relative(process.cwd(), examplesOutDir)}`,
  );
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
