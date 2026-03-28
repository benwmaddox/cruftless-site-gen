import { describe, expect, it } from "vitest";

import { renderFaq } from "./faq.render.js";
import { FaqSchema } from "./faq.schema.js";

describe("FaqSchema", () => {
  it("accepts valid content and renders disclosure markup", () => {
    const parsed = FaqSchema.parse({
      type: "faq",
      title: "Common questions",
      items: [
        {
          question: "Can content authors add arbitrary classes?",
          answer: "No. Class names only come from framework code.",
        },
      ],
    });

    const html = renderFaq(parsed);

    expect(html).toContain('<section class="c-faq">');
    expect(html).toContain('<details class="c-faq__item">');
    expect(html).toContain("Class names only come from framework code.");
  });

  it("rejects empty items and unknown nested fields", () => {
    const emptyItems = FaqSchema.safeParse({
      type: "faq",
      title: "Common questions",
      items: [],
    });

    expect(emptyItems.success).toBe(false);
    if (emptyItems.success) {
      return;
    }

    expect(
      emptyItems.error.issues.some((issue) => String(issue.path.join(".")) === "items"),
    ).toBe(true);

    const extraField = FaqSchema.safeParse({
      type: "faq",
      title: "Common questions",
      items: [
        {
          question: "Can content authors add arbitrary classes?",
          answer: "No. Class names only come from framework code.",
          openByDefault: true,
        },
      ],
    });

    expect(extraField.success).toBe(false);
    if (extraField.success) {
      return;
    }

    expect(
      extraField.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "items.0",
      ),
    ).toBe(true);
  });
});
