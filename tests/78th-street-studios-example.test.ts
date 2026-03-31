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
    expect(siteContent.site.themeOverrides).toEqual({
      structure: "plain",
      secondaryColorScheme: "twilight-mist",
    });
    expect(siteContent.site.layout?.components).toBeDefined();
    expect(siteContent.pages.map((page) => page.slug)).toEqual(["/", "/about"]);

    const outDir = await mkdtemp(path.join(os.tmpdir(), "78th-street-studios-"));

    try {
      await buildSiteFromFile(exampleContentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");
      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");

      expect(homeHtml).toContain("Explore the building");
      expect(homeHtml).toContain("Northeast Ohio&#39;s Eclectic Arts Maze");
      expect(homeHtml).toContain("Host an event inside Cleveland&#39;s best-known arts maze");
      expect(homeHtml).toContain("Featured gallery image from inside 78th Street Studios");
      expect(homeHtml).toContain("Third Fridays return on Friday, April 17, 2026");
      expect(homeHtml).toContain("Contact 78th Street Studios");
      expect(aboutHtml).toContain("Built in 1905, still full of working creatives");
      expect(aboutHtml).toContain("Baker Electric Motor Vehicle Company");
      expect(aboutHtml).toContain("Who&#39;s inside the building");
      expect(aboutHtml).toContain("ARTneo Museum");
      expect(aboutHtml).toContain("Old freight doors, long corridors, and raw industrial surfaces");
      expect(aboutHtml).toContain("Third Fridays return on Friday, April 17, 2026");
      expect(aboutHtml).toContain("Contact 78th Street Studios");
      expect(homeHtml.indexOf("Explore the building")).toBeLessThan(
        homeHtml.indexOf("Northeast Ohio&#39;s Eclectic Arts Maze"),
      );
      expect(homeHtml.indexOf("Northeast Ohio&#39;s Eclectic Arts Maze")).toBeLessThan(
        homeHtml.indexOf("Contact 78th Street Studios"),
      );
      expect(aboutHtml.indexOf("Explore the building")).toBeLessThan(
        aboutHtml.indexOf("Built in 1905, still full of working creatives"),
      );
      expect(aboutHtml.indexOf("Built in 1905, still full of working creatives")).toBeLessThan(
        aboutHtml.indexOf("Contact 78th Street Studios"),
      );
      expect(homeHtml).toContain('data-theme="studio-industrial"');
      expect(css).toContain('--font-family-heading: "Optima", "Avenir Next", sans-serif;');
      expect(css).toContain("--color-scheme: dark;");
      expect(css).toContain("--color-primary: #9d7cd8;");
      expect(css).toContain("--color-accent: #ff9e64;");
      expect(css).toContain("--site-page-background-image:");
      expect(css).toContain(
        'url("https://78thstreetstudios.com/sites/78thstreetstudios.com/files/styles/adaptive/public/media/images/background/IMG_CFD448348658-1.jpeg?itok=FLmeLmsX")',
      );
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
