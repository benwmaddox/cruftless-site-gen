import { describe, expect, it } from "vitest";

import {
  inferImageExtension,
  replaceLandingImageReferences,
} from "../src/discovery/landing-image-localization.js";

describe("landing image localization helpers", () => {
  it("infers an image extension from content type before URL suffix", () => {
    expect(
      inferImageExtension("https://example.com/images/hero.jpeg?size=1200", "image/webp"),
    ).toBe(".webp");
    expect(
      inferImageExtension("https://example.com/images/hero.jpeg?size=1200", null),
    ).toBe(".jpeg");
  });

  it("rewrites nested landing-page references and leaves other strings alone", () => {
    const input = {
      site: {
        pageBackgroundImageUrl: "/content/images/landing-page.png",
      },
      pages: [
        {
          components: [
            {
              type: "media",
              src: "/content/images/landing-page.jpg",
            },
            {
              type: "prose",
              paragraphs: ["No image path here."],
            },
          ],
        },
      ],
    };

    expect(
      replaceLandingImageReferences(input, "/content/images/landing-page.webp"),
    ).toEqual({
      value: {
        site: {
          pageBackgroundImageUrl: "/content/images/landing-page.webp",
        },
        pages: [
          {
            components: [
              {
                type: "media",
                src: "/content/images/landing-page.webp",
              },
              {
                type: "prose",
                paragraphs: ["No image path here."],
              },
            ],
          },
        ],
      },
      updatedReferenceCount: 2,
    });
  });
});
