import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  themePreviewImageHref,
  themePreviewViewport,
} from "../src/build/theme-example-previews.js";
import { componentTypeNames } from "../src/components/index.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { themeNames } from "../src/themes/index.js";

const examplesContentDir = path.resolve(process.cwd(), "content/examples/themes");
const examplesIndexPath = path.join(examplesContentDir, "index.json");

describe("theme examples", () => {
  it("wires the preview index to real screenshot-backed cards for every theme", async () => {
    const rawJson = await readFile(examplesIndexPath, "utf8");
    const siteContent = SiteContentSchema.parse(JSON.parse(rawJson) as unknown);
    const featureGridComponents = siteContent.pages[0]?.components.filter(
      (component) => component.type === "feature-grid",
    );

    const items = featureGridComponents?.flatMap((component) => component.items) ?? [];

    expect(items).toHaveLength(themeNames.length);
    expect(items.map((item) => item.title)).toEqual([
      "Corporate",
      "Brutalism",
      "Workshop",
      "Refined Professional",
      "Friendly Modern",
      "Heritage Local",
      "Wellness Calm",
      "High-Vis Service",
    ]);

    expect(
      items.map((item) => ({
        href: item.cta?.href,
        imageAlt: item.image?.alt,
        imageHeight: item.image?.height,
        imageLayout: item.imageLayout,
        imageSrc: item.image?.src,
        imageWidth: item.image?.width,
      })),
    ).toEqual([
      {
        href: "/examples/corporate/",
        imageAlt: "Real mobile screenshot preview of the corporate theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("corporate"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/brutalism/",
        imageAlt: "Real mobile screenshot preview of the brutalism theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("brutalism"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/workshop/",
        imageAlt: "Real mobile screenshot preview of the workshop theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("workshop"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/refined-professional/",
        imageAlt: "Real mobile screenshot preview of the refined professional theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("refined-professional"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/friendly-modern/",
        imageAlt: "Real mobile screenshot preview of the friendly modern theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("friendly-modern"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/heritage-local/",
        imageAlt: "Real mobile screenshot preview of the heritage local theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("heritage-local"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/wellness-calm/",
        imageAlt: "Real mobile screenshot preview of the wellness calm theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("wellness-calm"),
        imageWidth: themePreviewViewport.width,
      },
      {
        href: "/examples/high-vis-service/",
        imageAlt: "Real mobile screenshot preview of the high-vis service theme example page",
        imageHeight: themePreviewViewport.height,
        imageLayout: "stacked",
        imageSrc: themePreviewImageHref("high-vis-service"),
        imageWidth: themePreviewViewport.width,
      },
    ]);
  });

  it("provides one example fixture for every theme", async () => {
    const fixtureFileNames = await Promise.all(
      themeNames.map(async (themeName) => {
        const contentPath = path.join(examplesContentDir, `${themeName}.json`);
        const rawJson = await readFile(contentPath, "utf8");
        const siteContent = SiteContentSchema.parse(JSON.parse(rawJson) as unknown);
        const page = siteContent.pages[0];
        const componentTypes = page.components.map((component) => component.type);
        const layoutComponents = siteContent.site.layout?.components ?? [];
        const sharedComponentTypes = layoutComponents
          .filter((component) => component.type !== "page-content")
          .map((component) => component.type);
        const allComponentTypes = Array.from(
          new Set([...componentTypes, ...sharedComponentTypes]),
        ).sort();

        expect(siteContent.site.theme).toBe(themeName);
        expect(siteContent.pages).toHaveLength(1);
        expect(allComponentTypes).toEqual([...componentTypeNames].sort());
        expect(layoutComponents.map((component) => component.type)).toContain("page-content");
        expect(sharedComponentTypes).toContain("navigation-bar");
        expect(sharedComponentTypes.length).toBeGreaterThan(0);

        return path.basename(contentPath);
      }),
    );

    expect(fixtureFileNames).toEqual(themeNames.map((themeName) => `${themeName}.json`));
  });
});
