import { describe, expect, it } from "vitest";

import {
  dedupeImageCandidates,
  extractLinkedCssImageCandidates,
  extractPageImageCandidates,
  extractStylesheetLinks,
} from "../src/discovery/page-image-discovery.js";

describe("page image discovery", () => {
  it("extracts image candidates from meta tags, images, and inline styles", () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="/images/hero.jpg" />
          <meta name="twitter:image" content="https://cdn.example.com/social.png" />
        </head>
        <body>
          <section style="background-image: linear-gradient(#000, #000), url('/images/bg.jpg')"></section>
          <img src="/images/card.jpg" srcset="/images/card@2x.jpg 2x, /images/card@3x.jpg 3x" />
        </body>
      </html>
    `;

    const candidates = extractPageImageCandidates(html, "https://example.com/services/");

    expect(candidates.map((candidate) => candidate.url)).toEqual([
      "https://example.com/images/hero.jpg",
      "https://cdn.example.com/social.png",
      "https://example.com/images/bg.jpg",
      "https://example.com/images/card@2x.jpg",
      "https://example.com/images/card@3x.jpg",
      "https://example.com/images/card.jpg",
    ]);
  });

  it("discovers stylesheet links and resolves CSS background images", () => {
    const html = `
      <html>
        <head>
          <link rel="stylesheet preload" href="/assets/site.css" />
        </head>
      </html>
    `;
    const css = `
      .hero {
        background-image: linear-gradient(#000, #000), url("../images/hero.webp");
      }
    `;

    const stylesheetUrls = extractStylesheetLinks(html, "https://example.com/services/");
    expect(stylesheetUrls).toEqual(["https://example.com/assets/site.css"]);

    const candidates = extractLinkedCssImageCandidates(
      stylesheetUrls[0]!,
      css,
      "https://example.com/services/",
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      url: "https://example.com/images/hero.webp",
      source: "linked-css:https://example.com/assets/site.css",
      sameOrigin: true,
    });
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(88);
  });

  it("dedupes candidates by keeping the highest-ranked source", () => {
    const candidates = dedupeImageCandidates([
      {
        url: "https://example.com/images/hero.jpg",
        source: "img:src",
        score: 70,
        sameOrigin: true,
      },
      {
        url: "https://example.com/images/hero.jpg",
        source: "meta:og:image",
        score: 100,
        sameOrigin: true,
      },
    ]);

    expect(candidates).toEqual([
      {
        url: "https://example.com/images/hero.jpg",
        source: "meta:og:image",
        score: 100,
        sameOrigin: true,
      },
    ]);
  });
});
