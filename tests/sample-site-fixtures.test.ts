import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";

const fixturePath = path.resolve(process.cwd(), "content/examples/78thstreetstudios.json");

describe("sample site fixtures", () => {
  it("validates the 78th Street Studios fixture", async () => {
    const site = await loadValidatedSite(fixturePath);

    expect(site.site.name).toBe("78th Street Studios");
    expect(site.pages.map((page) => page.slug)).toEqual(["/", "/about"]);
  });

  it("builds the 78th Street Studios fixture into the expected pages", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-78ss-"));

    try {
      await buildSiteFromFile(fixturePath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");

      expect(homeHtml).toContain("Northeast Ohio&#39;s eclectic arts maze");
      expect(homeHtml).toContain("What stands out on the live site");
      expect(aboutHtml).toContain("Sections translated from the live about page");
      expect(aboutHtml).toContain("This demo keeps the message, not the old Drupal structure");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
