import { describe, expect, it } from "vitest";

import { SiteContentSchema } from "../src/schemas/site.schema.js";
import { collectSiteValidationIssues } from "../src/validation/site-validation.js";

const validSite = SiteContentSchema.parse({
  site: {
    name: "LaunchKit",
    baseUrl: "https://launchkit.example",
    theme: "app-announcement",
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
});
