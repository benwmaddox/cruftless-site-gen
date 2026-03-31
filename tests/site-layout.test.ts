import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";

describe("site layout", () => {
  it("renders shared site-level components around page-local content", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-layout-"));
    const site = SiteContentSchema.parse({
      site: {
        name: "LaunchKit",
        baseUrl: "https://launchkit.example",
        theme: "app-announcement",
        layout: {
          components: [
            {
              type: "prose",
              title: "Shared header",
              paragraphs: ["This introduction appears on every page."],
            },
            {
              type: "page-content",
            },
            {
              type: "prose",
              title: "Shared footer",
              paragraphs: ["This footer note appears after page content."],
            },
          ],
        },
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          components: [
            {
              type: "hero",
              headline: "Launch faster",
              primaryCta: {
                label: "Get started",
                href: "/start",
              },
            },
          ],
        },
        {
          slug: "/pricing",
          title: "Pricing",
          components: [
            {
              type: "faq",
              title: "Pricing FAQ",
              items: [
                {
                  question: "Is there a free plan?",
                  answer: "Yes, teams can start without a contract.",
                },
              ],
            },
          ],
        },
      ],
    });

    try {
      await buildSite(site, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const pricingHtml = await readFile(path.join(outDir, "pricing", "index.html"), "utf8");

      expect(homeHtml).toContain("Shared header");
      expect(homeHtml).toContain("Launch faster");
      expect(homeHtml).toContain("Shared footer");
      expect(homeHtml).toContain('<link rel="stylesheet" href="assets/site.css" />');
      expect(homeHtml.indexOf("Shared header")).toBeLessThan(homeHtml.indexOf("Launch faster"));
      expect(homeHtml.indexOf("Launch faster")).toBeLessThan(homeHtml.indexOf("Shared footer"));

      expect(pricingHtml).toContain("Shared header");
      expect(pricingHtml).toContain("Pricing FAQ");
      expect(pricingHtml).toContain("Shared footer");
      expect(pricingHtml).toContain('<link rel="stylesheet" href="../assets/site.css" />');
      expect(pricingHtml.indexOf("Shared header")).toBeLessThan(pricingHtml.indexOf("Pricing FAQ"));
      expect(pricingHtml.indexOf("Pricing FAQ")).toBeLessThan(pricingHtml.indexOf("Shared footer"));
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("renders a shared navigation bar and emits its measured-collapse runtime", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-navbar-layout-"));
    const site = SiteContentSchema.parse({
      site: {
        name: "LaunchKit",
        baseUrl: "https://launchkit.example",
        theme: "app-announcement",
        layout: {
          components: [
            {
              type: "navigation-bar",
              brandText: "LaunchKit",
              links: [
                {
                  label: "Home",
                  href: "/",
                },
                {
                  label: "Pricing",
                  href: "/pricing",
                },
                {
                  label: "Contact",
                  href: "/contact",
                },
              ],
            },
            {
              type: "page-content",
            },
          ],
        },
      },
      pages: [
        {
          slug: "/",
          title: "Home",
          components: [
            {
              type: "hero",
              headline: "Launch faster",
              primaryCta: {
                label: "Get started",
                href: "/start",
              },
            },
          ],
        },
        {
          slug: "/pricing",
          title: "Pricing",
          components: [
            {
              type: "faq",
              title: "Pricing FAQ",
              items: [
                {
                  question: "Is there a free plan?",
                  answer: "Yes, teams can start without a contract.",
                },
              ],
            },
          ],
        },
      ],
    });

    try {
      await buildSite(site, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const pricingHtml = await readFile(path.join(outDir, "pricing", "index.html"), "utf8");
      const js = await readFile(path.join(outDir, "assets", "site.js"), "utf8");

      expect(homeHtml).toContain('data-js="navigation-bar"');
      expect(homeHtml).toContain('<script src="assets/site.js" defer></script>');
      expect(pricingHtml).toContain('<script src="../assets/site.js" defer></script>');
      expect(homeHtml.indexOf('class="c-navbar"')).toBeLessThan(homeHtml.indexOf("Launch faster"));
      expect(pricingHtml.indexOf('class="c-navbar"')).toBeLessThan(
        pricingHtml.indexOf("Pricing FAQ"),
      );
      expect(js).toContain("resolveNavigationBarMode");
      expect(js).toContain("ResizeObserver");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
