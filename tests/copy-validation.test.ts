import { describe, expect, it } from "vitest";

import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { collectCopyValidationIssues } from "../src/validation/copy-validation.js";

const validSite = SiteContentSchema.parse({
  site: {
    name: "LaunchKit",
    baseUrl: "https://launchkit.example",
    theme: "friendly-modern",
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
  ],
});

describe("collectCopyValidationIssues", () => {
  it("passes clean publish-ready copy", () => {
    expect(collectCopyValidationIssues(validSite)).toEqual([]);
  });

  it("rejects banned migration wording in nested component copy", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      pages: [
        {
          ...validSite.pages[0],
          components: [
            {
              type: "prose",
              title: "About",
              paragraphs: ["This page preserves what the live site already says best."],
            },
          ],
        },
      ],
    });

    expect(collectCopyValidationIssues(invalidSite)).toEqual([
      {
        path: ["pages", 0, "components", 0, "paragraphs", 0],
        message: "copy must be public-facing publish-ready content, not meta wording about the live site",
      },
    ]);
  });

  it("rejects multiple banned phrases across the site", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        name: "This Demo Services",
      },
      pages: [
        {
          ...validSite.pages[0],
          title: "The Rebuild",
          components: validSite.pages[0].components,
        },
      ],
    });

    expect(collectCopyValidationIssues(invalidSite)).toEqual([
      {
        path: ["site", "name"],
        message: "copy must be public-facing publish-ready content, not meta wording about the demo",
      },
      {
        path: ["pages", 0, "title"],
        message: "copy must be public-facing publish-ready content, not meta wording about the rebuild",
      },
    ]);
  });
});
