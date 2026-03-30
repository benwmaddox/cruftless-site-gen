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

      expect(homeHtml).toContain("Northeast Ohio&#39;s Eclectic Arts Maze");
      expect(homeHtml).toContain("Third Fridays");
      expect(homeHtml).toContain("Featured gallery image from inside 78th Street Studios");
      expect(aboutHtml).toContain("Built in 1905, still full of working creatives");
      expect(aboutHtml).toContain("Baker Electric Motor Vehicle Company");
      expect(aboutHtml).toContain("Old freight doors, long corridors, and raw industrial surfaces");
      expect(homeHtml).toContain('data-theme="studio-industrial"');
      expect(css).toContain('--font-family-heading: "Bookman Old Style", "Palatino Linotype", serif;');
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
