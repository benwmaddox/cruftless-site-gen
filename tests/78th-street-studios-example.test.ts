import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";

const exampleContentPath = path.resolve(
  process.cwd(),
  "content/examples/78th-street-studios.json",
);

describe("78th Street Studios example", () => {
  it("validates and renders the requested home and about pages", async () => {
    const siteContent = await loadValidatedSite(exampleContentPath);

    expect(siteContent.site.name).toBe("78th Street Studios");
    expect(siteContent.pages.map((page) => page.slug)).toEqual(["/", "/about"]);

    const outDir = await mkdtemp(path.join(os.tmpdir(), "78th-street-studios-"));

    try {
      await buildSiteFromFile(exampleContentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");
      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");

      expect(homeHtml).toContain("Northeast Ohio&#39;s eclectic arts maze");
      expect(homeHtml).toContain("Third Fridays");
      expect(aboutHtml).toContain("A century-old building turned creative hub");
      expect(aboutHtml).toContain("Baker Electric Motor Vehicle Company");
      expect(homeHtml).toContain('data-theme="brutalism"');
      expect(css).toContain("--color-bg: #fff7e8;");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
