import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { buildSiteFromFile } from "../src/build/framework.js";

const exampleContentPath = path.resolve(
  process.cwd(),
  "content/examples/78th-street-studios.json",
);

describe("78th Street Studios example content", () => {
  it("validates and builds the home and about pages", async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), "cruftless-78th-street-"));

    try {
      const siteContent = await buildSiteFromFile(exampleContentPath, outDir);

      expect(siteContent.site.name).toBe("78th Street Studios");
      expect(siteContent.pages.map((page) => page.slug)).toEqual(["/", "/about"]);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");

      expect(homeHtml).toContain("<title>78th Street Studios</title>");
      expect(homeHtml).toContain("Third Fridays");
      expect(aboutHtml).toContain("<title>About | 78th Street Studios</title>");
      expect(aboutHtml).toContain("What is 78th Street Studios?");
      expect(aboutHtml).toContain("Baker Electric Motor Vehicle Company");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
