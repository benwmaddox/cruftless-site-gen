import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildVsCodeSettings,
  buildSiteContentJsonSchema,
  siteContentJsonSchemaPath,
  vscodeSettingsPath,
} from "../schemas/site-json-schema.js";

const generatedArtifacts = [
  {
    path: siteContentJsonSchemaPath,
    content: `${JSON.stringify(buildSiteContentJsonSchema(), null, 2)}\n`,
  },
  {
    path: vscodeSettingsPath,
    content: `${JSON.stringify(buildVsCodeSettings(), null, 2)}\n`,
  },
];

const isCheckMode = process.argv.includes("--check");

if (isCheckMode) {
  const staleArtifacts: string[] = [];

  for (const artifact of generatedArtifacts) {
    let existingContent: string;

    try {
      existingContent = await readFile(artifact.path, "utf8");
    } catch {
      staleArtifacts.push(path.relative(process.cwd(), artifact.path));
      continue;
    }

    if (existingContent !== artifact.content) {
      staleArtifacts.push(path.relative(process.cwd(), artifact.path));
    }
  }

  if (staleArtifacts.length > 0) {
    console.error(
      `Generated schema artifacts are out of date: ${staleArtifacts.join(", ")}. Run npm run schema:generate.`,
    );
    process.exit(1);
  }

  console.log("Generated schema artifacts are up to date.");
} else {
  for (const artifact of generatedArtifacts) {
    await mkdir(path.dirname(artifact.path), { recursive: true });
    await writeFile(artifact.path, artifact.content, "utf8");

    console.log(`Generated ${path.relative(process.cwd(), artifact.path)}`);
  }
}
