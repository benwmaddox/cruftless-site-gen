import { describe, expect, it } from "vitest";

import { renderLogoStrip } from "./logo-strip.render.js";
import { LogoStripSchema } from "./logo-strip.schema.js";

describe("LogoStripSchema", () => {
  it("accepts linked and unlinked logos and renders a reusable trust strip", () => {
    const parsed = LogoStripSchema.parse({
      type: "logo-strip",
      title: "Trusted by teams that need clear proof points",
      lead: "Use a logo strip when the redesign needs lightweight trust badges.",
      logos: [
        {
          src: "https://images.example.com/logos/atlas.svg",
          alt: "Atlas Construction",
          href: "https://atlas.example.com",
        },
        {
          src: "https://images.example.com/logos/harbor.svg",
          alt: "Harbor Studio",
        },
      ],
    });

    const html = renderLogoStrip(parsed);

    expect(html).toContain('<section class="c-logo-strip l-container l-section">');
    expect(html).toContain('href="https://atlas.example.com"');
    expect(html).toContain('class="c-logo-strip__image"');
  });

  it("rejects unknown fields inside logo items", () => {
    const result = LogoStripSchema.safeParse({
      type: "logo-strip",
      title: "Trusted by teams that need clear proof points",
      logos: [
        {
          src: "https://images.example.com/logos/atlas.svg",
          alt: "Atlas Construction",
          label: "Atlas",
        },
        {
          src: "https://images.example.com/logos/harbor.svg",
          alt: "Harbor Studio",
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
          String(issue.path.join(".")) === "logos.0",
      ),
    ).toBe(true);
  });
});
