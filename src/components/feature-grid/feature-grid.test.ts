import { describe, expect, it } from "vitest";

import { renderFeatureGrid } from "./feature-grid.render.js";
import { FeatureGridSchema } from "./feature-grid.schema.js";

describe("FeatureGridSchema", () => {
  it("accepts valid content and renders list markup", () => {
    const parsed = FeatureGridSchema.parse({
      type: "feature-grid",
      title: "Why it works",
      items: [
        {
          title: "Strict validation",
          body: "Unknown keys fail.",
          image: {
            src: "https://example.com/validation.jpg",
            alt: "Validation checklist on a desk",
            caption: "Optional image support keeps content flexible.",
          },
        },
      ],
    });

    const html = renderFeatureGrid(parsed);

    expect(html).toContain('<section class="c-feature-grid">');
    expect(html).toContain('<ul class="c-feature-grid__items">');
    expect(html).toContain('c-feature-grid__item--has-image');
    expect(html).toContain('<figure class="c-feature-grid__item-media">');
    expect(html).toContain('src="https://example.com/validation.jpg"');
    expect(html).toContain("Strict validation");
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
});
