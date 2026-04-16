import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { themeNames, type ThemeName } from "../src/themes/index.js";

const themeMarkers: Record<ThemeName, string> = {
  corporate: "--accent: #2563eb;",
  brutalism: '--font-heading: "Space Grotesk", sans-serif;',
  workshop: '--font-heading: "Source Serif 4", serif;',
  "refined-professional": "--accent: #e2c46a;",
  "friendly-modern": "--accent: #e11d48;",
  "heritage-local": "--accent: #7a1f2b;",
  "wellness-calm": "--primary: #2f7c64;",
  "high-vis-service": "--primary: #ffd400;",
};

const createSite = (theme: ThemeName) =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme,
    },
    pages: [
      {
        slug: "/",
        title: "Home",
        components: [
          {
            type: "hero",
            headline: "Launch faster",
            subheadline: "Theme-driven static pages without custom templates.",
            primaryCta: {
              label: "Get started",
              href: "/start",
            },
          },
        ],
      },
    ],
  });

const createSiteWithCssVariables = (theme: ThemeName) =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme,
      cssVariables: {
        "--space-md": "2.25rem",
        "--primary": "#ff5500",
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
            subheadline: "Theme-driven static pages without custom templates.",
            primaryCta: {
              label: "Get started",
              href: "/start",
            },
          },
        ],
      },
    ],
  });

describe("buildSite theme CSS", () => {
  it.each(themeNames)("emits theme-specific token CSS for %s", async (theme) => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-theme-"));

    try {
      await buildSite(createSite(theme), outDir);

      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");
      const html = await readFile(path.join(outDir, "index.html"), "utf8");

      expect(css).toContain(themeMarkers[theme]);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(css).not.toContain("78thstreetstudios.com");

      for (const otherTheme of themeNames) {
        if (otherTheme === theme) {
          continue;
        }

        expect(css).not.toContain(themeMarkers[otherTheme]);
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("emits site css variable overrides from content", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-theme-css-vars-"));

    try {
      await buildSite(createSiteWithCssVariables("corporate"), outDir);

      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");

      expect(css).toContain("--space-md: 2.25rem;");
      expect(css).toContain("--primary: #ff5500;");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
