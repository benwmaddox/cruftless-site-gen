import { describe, expect, it } from "vitest";

import { renderFeatureList } from "./feature-list.render.js";
import { FeatureListSchema } from "./feature-list.schema.js";

describe("FeatureListSchema", () => {
  it("accepts valid content and renders ordered list markup", () => {
    const parsed = FeatureListSchema.parse({
      type: "feature-list",
      title: "How teams keep output reviewable",
      items: [
        {
          title: "Lock the schema",
          body: "Make invalid content fail early.",
        },
      ],
    });

    const html = renderFeatureList(parsed);

    expect(html).toContain('<section class="c-feature-list">');
    expect(html).toContain('<ol class="c-feature-list__items">');
    expect(html).toContain("Lock the schema");
  });

  it("rejects nested unknown fields", () => {
    const result = FeatureListSchema.safeParse({
      type: "feature-list",
      title: "How teams keep output reviewable",
      items: [
        {
          title: "Lock the schema",
          body: "Make invalid content fail early.",
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
