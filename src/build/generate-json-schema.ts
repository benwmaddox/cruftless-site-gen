import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildSiteContentJsonSchema,
  siteContentJsonSchemaPath,
} from "../schemas/site-json-schema.js";

const schemaContent = `${JSON.stringify(buildSiteContentJsonSchema(), null, 2)}\n`;

await mkdir(path.dirname(siteContentJsonSchemaPath), { recursive: true });
await writeFile(siteContentJsonSchemaPath, schemaContent, "utf8");

console.log(`Generated ${path.relative(process.cwd(), siteContentJsonSchemaPath)}`);
