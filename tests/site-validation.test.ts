import { describe, expect, it } from "vitest";

import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { collectSiteValidationIssues } from "../src/validation/site-validation.js";

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

describe("collectSiteValidationIssues", () => {
  it("passes a valid site", () => {
    expect(collectSiteValidationIssues(validSite)).toEqual([]);
  });

  it("rejects duplicate slugs and more than one hero per page", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      pages: [
        {
          ...validSite.pages[0],
          components: [
            validSite.pages[0].components[0],
            {
              type: "hero",
              headline: "Another hero",
              primaryCta: {
                label: "Read more",
                href: "/more",
              },
            },
          ],
        },
        {
          ...validSite.pages[0],
        },
      ],
    });

    const issues = collectSiteValidationIssues(invalidSite);

    expect(issues).toHaveLength(2);
    expect(issues.some((issue) => issue.message.includes("duplicate slug"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("only one hero"))).toBe(true);
  });

  it("requires a shared site layout to include exactly one page-content slot", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          components: [
            {
              type: "prose",
              title: "Shared intro",
              paragraphs: ["This shows up on every page."],
            },
          ],
        },
      },
    });

    expect(collectSiteValidationIssues(invalidSite)).toEqual([
      {
        path: ["site", "layout", "components"],
        message: "site layout must include exactly one 'page-content' slot",
      },
    ]);
  });

  it("rejects shared site layouts with more than one page-content slot", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          components: [
            {
              type: "page-content",
            },
            {
              type: "prose",
              title: "Shared note",
              paragraphs: ["This should only wrap the page once."],
            },
            {
              type: "page-content",
            },
          ],
        },
      },
    });

    expect(collectSiteValidationIssues(invalidSite)).toEqual([
      {
        path: ["site", "layout", "components"],
        message: "site layout must include exactly one 'page-content' slot",
      },
    ]);
  });

  it("counts shared layout heroes against each rendered page", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          components: [
            {
              type: "hero",
              headline: "Shared site hero",
              primaryCta: {
                label: "Learn more",
                href: "/learn-more",
              },
            },
            {
              type: "page-content",
            },
          ],
        },
      },
    });

    const issues = collectSiteValidationIssues(invalidSite);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      path: ["pages", 0, "components", 0],
      componentType: "hero",
      message: "only one hero is allowed per page",
    });
  });

  it("counts nested heroes inside horizontal split components against each page", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      pages: [
        {
          ...validSite.pages[0],
          components: [
            validSite.pages[0].components[0],
            {
              type: "horizontal-split",
              first: {
                type: "prose",
                title: "Left column",
                paragraphs: ["Nested layout copy"],
              },
              second: {
                type: "hero",
                headline: "Nested hero",
                primaryCta: {
                  label: "Read more",
                  href: "/more",
                },
              },
            },
          ],
        },
      ],
    });

    expect(collectSiteValidationIssues(invalidSite)).toEqual([
      {
        path: ["pages", 0, "components", 1, "second"],
        componentType: "hero",
        message: "only one hero is allowed per page",
      },
    ]);
  });
});
