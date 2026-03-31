import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { componentTypeNames } from "../src/components/index.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { themeNames } from "../src/themes/index.js";

const examplesContentDir = path.resolve(process.cwd(), "content/examples/themes");

describe("theme examples", () => {
  it("provides one example fixture for every theme", async () => {
    const fixtureFileNames = await Promise.all(
      themeNames.map(async (themeName) => {
        const contentPath = path.join(examplesContentDir, `${themeName}.json`);
        const rawJson = await readFile(contentPath, "utf8");
        const siteContent = SiteContentSchema.parse(JSON.parse(rawJson) as unknown);
        const page = siteContent.pages[0];
        const componentTypes = page.components.map((component) => component.type);

        expect(siteContent.site.theme).toBe(themeName);
        expect(siteContent.pages).toHaveLength(1);
        expect(componentTypes).toEqual(componentTypeNames);

        return path.basename(contentPath);
      }),
    );

    expect(fixtureFileNames).toEqual(themeNames.map((themeName) => `${themeName}.json`));
  });
});
