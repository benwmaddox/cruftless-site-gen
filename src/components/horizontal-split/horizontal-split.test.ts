import { describe, expect, it } from "vitest";

import { ComponentSchema, renderComponent } from "../index.js";

describe("HorizontalSplitSchema", () => {
  it("renders nested components side by side with an optional title", () => {
    const parsed = ComponentSchema.parse({
      type: "horizontal-split",
      title: "Visit or Call",
      first: {
        type: "contact",
        address: "123 Main St\nSpringfield, IL 62701",
        phone: "(555) 123-4567",
      },
      second: {
        type: "hours",
        entries: [
          {
            day: "Monday",
            open: "8:00 AM",
            close: "5:00 PM",
          },
        ],
      },
    });

    const html = renderComponent(parsed);

    expect(html).toContain('<section class="c-horizontal-split">');
    expect(html).toContain("Visit or Call");
    expect(html).toContain('class="c-contact"');
    expect(html).toContain('class="c-hours"');
  });

  it("requires both nested component slots", () => {
    const result = ComponentSchema.safeParse({
      type: "horizontal-split",
      first: {
        type: "prose",
        title: "One side",
        paragraphs: ["Nested content"],
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "second")).toBe(true);
  });
});
