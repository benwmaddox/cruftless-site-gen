import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { themeNames, type ThemeName } from "../src/themes/index.js";

const themeMarkers: Record<ThemeName, string> = {
  corporate: "--color-primary: #0b5fff;",
  brutalism: '--font-family-heading: "IBM Plex Mono", "Space Grotesk", monospace;',
  workshop: '--font-family-heading: "Source Serif 4", Georgia, serif;',
  "refined-professional": "--color-primary: #c9a227;",
  "friendly-modern": "--color-accent: #e11d48;",
  "heritage-local": "--color-accent: #7a1f2b;",
  "wellness-calm": "--color-primary: #2f7c64;",
  "high-vis-service": "--color-primary: #ffd400;",
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

const createSiteWithOverrides = (theme: ThemeName) =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme,
      themeOverrides: {
        structure: "divider",
        secondaryColorScheme: "midnight-canvas",
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

  it("emits override CSS and tokens for a supported override combination", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-theme-overrides-"));

    try {
      await buildSite(createSiteWithOverrides("corporate"), outDir);

      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");

      expect(css).toContain("--color-scheme: dark;");
      expect(css).toContain("--color-bg: #0a0e27;");
      expect(css).toContain("--color-primary: #6c8eff;");
      expect(css).toContain("--color-link: #a78bfa;");
      expect(css).toContain("--color-accent: #f472b6;");
      expect(css).toContain("border-width: 0 0 var(--border-width-1) 0;");
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
