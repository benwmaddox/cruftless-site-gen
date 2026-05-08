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

  it("allows shared header and footer layout components without a page-content slot", () => {
    const validLayoutSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          headerComponents: [
            {
              type: "prose",
              title: "Shared intro",
              paragraphs: ["This shows up before every page."],
            },
          ],
          footerComponents: [
            {
              type: "prose",
              title: "Shared footer",
              paragraphs: ["This shows up after every page."],
            },
          ],
        },
      },
    });

    expect(collectSiteValidationIssues(validLayoutSite)).toEqual([]);
  });

  it("requires a legacy shared site layout to include exactly one page-content slot", () => {
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
        message: "legacy site layout components must include exactly one 'page-content' slot",
      },
    ]);
  });

  it("rejects legacy shared site layouts with more than one page-content slot", () => {
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
        message: "legacy site layout components must include exactly one 'page-content' slot",
      },
    ]);
  });

  it("rejects layouts that mix legacy and header or footer component models", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          headerComponents: [
            {
              type: "prose",
              title: "Shared intro",
              paragraphs: ["This shows up before every page."],
            },
          ],
          components: [
            {
              type: "page-content",
            },
          ],
        },
      },
    });

    expect(collectSiteValidationIssues(invalidSite)).toEqual([
      {
        path: ["site", "layout"],
        message: "site layout cannot mix legacy 'components' with headerComponents or footerComponents",
      },
    ]);
  });

  it("counts shared layout heroes against each rendered page", () => {
    const invalidSite = SiteContentSchema.parse({
      ...validSite,
      site: {
        ...validSite.site,
        layout: {
          headerComponents: [
            {
              type: "hero",
              headline: "Shared site hero",
              primaryCta: {
                label: "Learn more",
                href: "/learn-more",
              },
            },
          ],
          footerComponents: [],
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

});
