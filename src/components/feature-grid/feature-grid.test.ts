import { describe, expect, it } from "vitest";

import { renderFeatureGrid } from "./feature-grid.render.js";
import { FeatureGridSchema } from "./feature-grid.schema.js";

describe("FeatureGridSchema", () => {
  it("accepts valid content and renders list markup", () => {
    const parsed = FeatureGridSchema.parse({
      type: "feature-grid",
      title: "Why it works",
      lead: "Use one flexible brochure section instead of separate list and link variants.",
      columns: "2",
      items: [
        {
          title: "Strict validation",
          body: "Unknown keys fail.",
          image: {
            src: "https://example.com/validation.jpg",
            alt: "Validation checklist on a desk",
            width: 1200,
            height: 800,
            caption: "Optional image support keeps content flexible.",
          },
          imageLayout: "stacked",
          selected: true,
          cta: {
            label: "See examples",
            href: "/examples",
            target: "_blank",
          },
        },
      ],
    });

    const html = renderFeatureGrid(parsed);

    expect(html).toContain('<section class="c-feature-grid l-container l-section">');
    expect(html).toContain('<p class="c-feature-grid__lead">');
    expect(html).toContain('<ul class="c-feature-grid__items c-feature-grid__items--cols-2">');
    expect(html).toContain('c-feature-grid__item--has-image');
    expect(html).toContain('c-feature-grid__item--stacked-image');
    expect(html).toContain('<figure class="c-feature-grid__item-media">');
    expect(html).toContain('src="https://example.com/validation.jpg"');
    expect(html).toContain('width="1200" height="800"');
    expect(html).toContain("Current selection");
    expect(html).toContain("Strict validation");
    expect(html).toContain('class="c-feature-grid__item-cta c-button c-button--secondary"');
    expect(html).toContain('href="/examples"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("See examples");
  });

  it("renders compact items without a body", () => {
    const parsed = FeatureGridSchema.parse({
      type: "feature-grid",
      title: "Theme navigation sample",
      columns: "3",
      items: [
        {
          title: "Corporate",
          selected: true,
        },
        {
          title: "Workshop",
          cta: {
            label: "Open Workshop",
            href: "/examples/workshop/",
          },
        },
      ],
    });

    const html = renderFeatureGrid(parsed);

    expect(html).toContain("c-feature-grid__item--compact");
    expect(html).not.toContain('<p class="c-feature-grid__item-body">');
    expect(html).toContain("Current selection");
    expect(html).toContain("Open Workshop");
  });

  it("rejects nested unknown fields", () => {
    const result = FeatureGridSchema.safeParse({
      type: "feature-grid",
      title: "Why it works",
      items: [
        {
          title: "Strict validation",
          body: "Unknown keys fail.",
          eyebrow: "Bad field",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "items.0",
      ),
    ).toBe(true);
  });

  it("rejects unknown fields inside an image reference", () => {
    const result = FeatureGridSchema.safeParse({
      type: "feature-grid",
      title: "Why it works",
      items: [
        {
          title: "Strict validation",
          body: "Unknown keys fail.",
          image: {
            src: "https://example.com/validation.jpg",
            alt: "Validation checklist on a desk",
            layout: "right",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "items.0.image",
      ),
    ).toBe(true);
  });

  it("rejects unknown fields inside an item CTA", () => {
    const result = FeatureGridSchema.safeParse({
      type: "feature-grid",
      title: "Why it works",
      items: [
        {
          title: "Strict validation",
          body: "Unknown keys fail.",
          cta: {
            label: "See examples",
            href: "/examples",
            tone: "quiet",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "items.0.cta",
      ),
    ).toBe(true);
  });

  it("accepts supported CTA targets", () => {
    const result = FeatureGridSchema.safeParse({
      type: "feature-grid",
      title: "Why it works",
      items: [
        {
          title: "Strict validation",
          cta: {
            label: "Open",
            href: "/examples",
            target: "_blank",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
