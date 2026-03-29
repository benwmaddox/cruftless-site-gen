import { describe, expect, it } from "vitest";

import { renderMedia } from "./media.render.js";
import { MediaSchema } from "./media.schema.js";

describe("MediaSchema", () => {
  it("accepts valid content and renders figure markup", () => {
    const parsed = MediaSchema.parse({
      type: "media",
      src: "https://example.com/studio.jpg",
      alt: "Founder standing in the studio",
      caption: "A real image gives landing pages more character than a card grid alone.",
      size: "content",
    });

    const html = renderMedia(parsed);

    expect(html).toContain('<figure class="c-media c-media--size-content">');
    expect(html).toContain('<img class="c-media__image"');
    expect(html).toContain('alt="Founder standing in the studio"');
    expect(html).toContain("<figcaption");
  });

  it("rejects unknown fields", () => {
    const result = MediaSchema.safeParse({
      type: "media",
      src: "https://example.com/studio.jpg",
      alt: "Founder standing in the studio",
      layout: "full-bleed",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
  });
});
