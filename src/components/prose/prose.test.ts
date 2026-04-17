import { describe, expect, it } from "vitest";

import { renderProse } from "./prose.render.js";
import { ProseSchema } from "./prose.schema.js";

describe("ProseSchema", () => {
  it("accepts long-form content and renders paragraphs in order", () => {
    const parsed = ProseSchema.parse({
      type: "prose",
      title: "Why the generator exists",
      lead: "Narrative sections need more room than a card grid gives them.",
      paragraphs: [
        "The generator exists to keep structure rigid while still giving a page enough room to explain itself.",
        "A long-form section lets a team keep the original flow of an about page instead of breaking it into disconnected tiles.",
      ],
    });

    const html = renderProse(parsed);

    expect(html).toContain('<section class="c-prose l-container l-section">');
    expect(html).toContain('<div class="c-prose__content">');
    expect(html).toContain("The generator exists to keep structure rigid");
    expect(html.indexOf("The generator exists")).toBeLessThan(
      html.indexOf("A long-form section lets a team"),
    );
  });

  it("rejects an empty paragraph list", () => {
    const result = ProseSchema.safeParse({
      type: "prose",
      paragraphs: [],
    });

    expect(result.success).toBe(false);
  });
});
