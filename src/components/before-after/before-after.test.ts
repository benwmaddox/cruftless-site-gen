import { describe, expect, it } from "vitest";

import { renderBeforeAfter } from "./before-after.render.js";
import { BeforeAfterSchema } from "./before-after.schema.js";

describe("BeforeAfterSchema", () => {
  it("accepts valid panels and renders paired compare cards", () => {
    const parsed = BeforeAfterSchema.parse({
      type: "before-after",
      title: "A clearer storefront refresh",
      lead: "Show the most obvious visual improvement side by side.",
      before: {
        label: "Before",
        src: "https://images.example.com/storefront-before.jpg",
        alt: "Old storefront with faded signage",
        caption: "Low contrast signs and a crowded entrance made the storefront harder to notice.",
      },
      after: {
        label: "After",
        src: "https://images.example.com/storefront-after.jpg",
        alt: "Updated storefront with clearer signs and brighter windows",
        caption: "Updated signage and brighter glazing made the storefront easier to spot from the street.",
      },
    });

    const html = renderBeforeAfter(parsed);

    expect(html).toContain('<section class="c-before-after l-section">');
    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).toContain('class="c-before-after__image"');
  });

  it("rejects unknown fields on compare panels", () => {
    const result = BeforeAfterSchema.safeParse({
      type: "before-after",
      title: "A clearer storefront refresh",
      before: {
        label: "Before",
        src: "https://images.example.com/storefront-before.jpg",
        alt: "Old storefront with faded signage",
        note: "No longer used",
      },
      after: {
        label: "After",
        src: "https://images.example.com/storefront-after.jpg",
        alt: "Updated storefront with clearer signs",
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "before",
      ),
    ).toBe(true);
  });
});
