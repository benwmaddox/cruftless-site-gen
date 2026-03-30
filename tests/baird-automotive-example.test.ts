import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";

const exampleContentPath = path.resolve(process.cwd(), "content/examples/baird-automotive.json");

describe("Baird Automotive example", () => {
  it("validates and renders all five public pages from the source site", async () => {
    const siteContent = await loadValidatedSite(exampleContentPath);

    expect(siteContent.site.name).toBe("Baird Automotive");
    expect(siteContent.site.theme).toBe("corporate");
    expect(siteContent.pages.map((page) => page.slug)).toEqual([
      "/",
      "/our-story",
      "/services",
      "/in-the-community",
      "/contact",
    ]);

    const outDir = await mkdtemp(path.join(os.tmpdir(), "baird-automotive-"));

    try {
      await buildSiteFromFile(exampleContentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const storyHtml = await readFile(path.join(outDir, "our-story", "index.html"), "utf8");
      const servicesHtml = await readFile(path.join(outDir, "services", "index.html"), "utf8");
      const communityHtml = await readFile(
        path.join(outDir, "in-the-community", "index.html"),
        "utf8",
      );
      const contactHtml = await readFile(path.join(outDir, "contact", "index.html"), "utf8");
      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");

      expect(homeHtml).toContain("Established Arlington auto repair with long local roots");
      expect(homeHtml).toContain("sunroof owners to clear drain tubes every fall");
      expect(homeHtml).toContain("https://www.bairdautomotive.com/images/content/baird_auto.jpg");

      expect(storyHtml).toContain("Built on loyal customers and decades of shop experience");
      expect(storyHtml).toContain("Washington Consumers&#39; CHECKBOOK Magazine");
      expect(storyHtml).toContain("https://www.bairdautomotive.com/images/content/baird_guys.jpg");

      expect(servicesHtml).toContain(
        "Full-service repair for domestic, Asian, and European vehicles",
      );
      expect(servicesHtml).toContain("Computerized alignment, tire balancing and rotation");
      expect(servicesHtml).toContain("https://www.bairdautomotive.com/images/content/ase.jpg");

      expect(communityHtml).toContain("Community support is part of the Baird Automotive identity");
      expect(communityHtml).toContain("Arlington Little League Rookies");
      expect(communityHtml).toContain("http://www.clarendon.org/mardi.html");

      expect(contactHtml).toContain("Find the shop in Arlington and get in touch directly");
      expect(contactHtml).toContain("mailto:joey@bairdautomotive.com");
      expect(contactHtml).toContain("3427 Washington Blvd., Arlington, VA 22201.");

      expect(homeHtml).toContain('data-theme="corporate"');
      expect(css).toContain('--font-family-heading: Georgia, "Times New Roman", serif;');
      expect(css).toContain("--color-primary: #004e8f;");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
