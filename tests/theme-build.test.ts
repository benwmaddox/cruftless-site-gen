import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { themeNames, type ThemeName } from "../src/themes/index.js";

const themeMarkers: Record<ThemeName, string> = {
  brutalism: "--button-hover-transform: translate(-3px, -3px);",
  "dark-saas": "--color-primary: #4da3ff;",
  corporate: '--font-family-heading: Georgia, "Times New Roman", serif;',
  "app-announcement":
    '--font-family-heading: "Arial Rounded MT Bold", "Trebuchet MS", sans-serif;',
  "studio-industrial":
    '--font-family-heading: "Bookman Old Style", "Palatino Linotype", serif;',
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

describe("buildSite theme CSS", () => {
  it.each(themeNames)("emits theme-specific token CSS for %s", async (theme) => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-theme-"));

    try {
      await buildSite(createSite(theme), outDir);

      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");
      const html = await readFile(path.join(outDir, "index.html"), "utf8");

      expect(css).toContain(themeMarkers[theme]);
      expect(html).toContain(`data-theme="${theme}"`);

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
});
