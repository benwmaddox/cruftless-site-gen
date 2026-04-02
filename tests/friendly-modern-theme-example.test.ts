import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";

const exampleContentPath = path.resolve(
  process.cwd(),
  "content/examples/themes/friendly-modern.json",
);

describe("friendly-modern theme example", () => {
  it("renders deterministic media markup and keeps the measuring nav non-interactive", async () => {
    const siteContent = await loadValidatedSite(exampleContentPath);
    const media = siteContent.pages[0]?.components.find((component) => component.type === "media");

    expect(siteContent.site.theme).toBe("friendly-modern");
    expect(media).toMatchObject({
      type: "media",
      width: 1600,
      height: 900,
    });

    const outDir = await mkdtemp(path.join(os.tmpdir(), "friendly-modern-theme-"));

    try {
      await buildSiteFromFile(exampleContentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const measureMarkup =
        homeHtml.match(/<nav class="c-navbar__measure" aria-hidden="true">([\s\S]*?)<\/nav>/)?.[1] ??
        "";

      expect(homeHtml).toContain('class="c-media__image"');
      expect(homeHtml).toContain('src="data:image/svg+xml,');
      expect(homeHtml).toContain('width="1600" height="900"');
      expect(homeHtml).not.toContain("images.example.com");
      expect(measureMarkup).toContain('<span class="c-navbar__link">');
      expect(measureMarkup).not.toContain("<a ");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
