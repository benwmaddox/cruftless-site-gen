import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";

const contentPath = path.resolve(process.cwd(), "content/78thstreetstudios.json");

describe("78th Street Studios test site content", () => {
  it("validates as a two-page site", async () => {
    const siteContent = await loadValidatedSite(contentPath);

    expect(siteContent.site.name).toBe("78th Street Studios");
    expect(siteContent.pages.map((page) => page.slug)).toEqual(["/", "/about"]);
  });

  it("builds the home and about pages", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "78ss-site-"));

    try {
      const siteContent = await buildSiteFromFile(contentPath, outDir);
      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");

      expect(siteContent.pages).toHaveLength(2);
      expect(homeHtml).toContain("Northeast Ohio&#39;s eclectic arts maze");
      expect(homeHtml).toContain('href="/about"');
      expect(aboutHtml).toContain("A century-old building turned creative hub");
      expect(aboutHtml).toContain("Visit 78thStreetStudios.com");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
