import { describe, expect, it } from "vitest";

import { renderMedia } from "./media.render.js";
import { MediaSchema } from "./media.schema.js";

describe("MediaSchema", () => {
  it("accepts valid content and renders figure markup", () => {
    const parsed = MediaSchema.parse({
      type: "media",
      src: "https://example.com/studio.jpg",
      alt: "Founder standing in the studio",
      width: 1600,
      height: 900,
      caption: "A real image gives landing pages more character than a card grid alone.",
      size: "content",
    });

    const html = renderMedia(parsed);

    expect(html).toContain('<figure class="c-media c-media--size-content">');
    expect(html).toContain('<img class="c-media__image"');
    expect(html).toContain('alt="Founder standing in the studio"');
    expect(html).toContain('style="width: 1600px; height: 900px;"');
    expect(html).not.toContain('width="1600" height="900"');
    expect(html).not.toContain('loading="');
    expect(html).toContain("<figcaption");
  });

  it("renders lazy loading when requested", () => {
    const parsed = MediaSchema.parse({
      type: "media",
      src: "https://example.com/studio.jpg",
      alt: "Founder standing in the studio",
      loading: "lazy",
      size: "content",
    });

    const html = renderMedia(parsed, {
      resolveImage: () => ({
        src: "https://example.com/studio.jpg",
        width: 1600,
        height: 900,
      }),
      resolveGalleryImage: () => ({
        src: "https://example.com/studio.jpg",
      }),
    });

    expect(html).toContain('loading="lazy"');
  });

  it("keeps intrinsic width and height attributes when explicit sizing is not provided", () => {
    const parsed = MediaSchema.parse({
      type: "media",
      src: "https://example.com/studio.jpg",
      alt: "Founder standing in the studio",
      size: "content",
    });

    const html = renderMedia(parsed, {
      resolveImage: () => ({
        src: "https://example.com/studio.jpg",
        width: 1600,
        height: 900,
      }),
      resolveGalleryImage: () => ({
        src: "https://example.com/studio.jpg",
      }),
    });

    expect(html).toContain('width="1600" height="900"');
    expect(html).not.toContain('style="width:');
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

  it("rejects media blocks without a src", () => {
    const result = MediaSchema.safeParse({
      type: "media",
      alt: "Founder standing in the studio",
      size: "wide",
    });

    expect(result.success).toBe(false);
  });

  it("rejects media blocks with an empty src", () => {
    const result = MediaSchema.safeParse({
      type: "media",
      src: "",
      alt: "Founder standing in the studio",
      size: "wide",
    });

    expect(result.success).toBe(false);
  });

  it("requires alt text when src is provided", () => {
    const result = MediaSchema.safeParse({
      type: "media",
      src: "https://example.com/studio.jpg",
    });

    expect(result.success).toBe(false);
  });
});
