import { describe, expect, it } from "vitest";

import { renderImageText } from "./image-text.render.js";
import { ImageTextSchema } from "./image-text.schema.js";

describe("ImageTextSchema", () => {
  it("accepts valid split-section content and renders image, copy, and actions", () => {
    const parsed = ImageTextSchema.parse({
      type: "image-text",
      eyebrow: "Popular refresh",
      title: "Pair a strong image with focused service copy",
      paragraphs: [
        "Use this split block for service overviews, about sections, or process summaries that need one anchoring photo.",
        "The section keeps image framing and CTA treatment aligned with the rest of the system.",
      ],
      imagePosition: "start",
      primaryCta: {
        label: "View examples",
        href: "/examples/",
      },
      secondaryCta: {
        label: "Get in touch",
        href: "/contact",
      },
      image: {
        src: "https://images.example.com/service-team.jpg",
        alt: "Service team standing in a finished lobby",
        caption: "Use a clear contextual image instead of a generic stock hero.",
      },
    });

    const html = renderImageText(parsed);

    expect(html).toContain("c-image-text--image-start");
    expect(html).toContain('<figure class="c-image-text__media">');
    expect(html).toContain('class="c-button c-button--primary"');
    expect(html).toContain("generic stock hero");
  });

  it("rejects empty paragraph arrays", () => {
    const result = ImageTextSchema.safeParse({
      type: "image-text",
      title: "Pair a strong image with focused service copy",
      paragraphs: [],
      image: {
        src: "https://images.example.com/service-team.jpg",
        alt: "Service team standing in a finished lobby",
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some((issue) => String(issue.path.join(".")) === "paragraphs"),
    ).toBe(true);
  });
});
