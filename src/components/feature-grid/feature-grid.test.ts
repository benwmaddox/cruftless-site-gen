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
        },
      ],
    });

    const html = renderFeatureGrid(parsed);

    expect(html).toContain('<section class="c-feature-grid">');
    expect(html).toContain('<ul class="c-feature-grid__items">');
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
});

