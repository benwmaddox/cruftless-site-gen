import { describe, expect, it } from "vitest";

import { renderHero } from "./hero.render.js";
import { HeroSchema } from "./hero.schema.js";

describe("HeroSchema", () => {
  it("accepts valid hero data and renders escaped semantic markup", () => {
    const parsed = HeroSchema.parse({
      type: "hero",
      headline: "Launch <faster>",
      subheadline: "Strict validation for teams.",
      primaryCta: {
        label: "Get started",
        href: "/start?x=%3Ctag%3E",
      },
      align: "center",
    });

    const html = renderHero(parsed);

    expect(html).toContain(
      '<section class="c-hero l-container l-section l-section--hero c-hero--align-center">',
    );
    expect(html).toContain("&lt;faster&gt;");
    expect(html).toContain("/start?x=%3Ctag%3E");
    expect(html).not.toContain("<faster>");
  });

  it("renders an optional background image on the hero section", () => {
    const parsed = HeroSchema.parse({
      type: "hero",
      headline: "Built for custom rooms",
      primaryCta: {
        label: "Call now",
        href: "tel:+15555555555",
      },
      backgroundImage: {
        src: "/content/images/generated-hero.png",
        alt: "Custom woodworking bench",
        position: "center 35%",
      },
    });

    const html = renderHero(parsed);

    expect(html).toContain("c-hero--has-background");
    expect(html).toContain("url('/content/images/generated-hero.png')");
    expect(html).toContain("background-position: center, center 35%");
    expect(html).not.toContain("Custom woodworking bench");
  });

  it("renders additional calls to action after the primary and secondary actions", () => {
    const parsed = HeroSchema.parse({
      type: "hero",
      headline: "Choose a platform",
      primaryCta: { label: "Android", href: "/android" },
      secondaryCta: { label: "Windows", href: "/windows" },
      additionalCtas: [
        { label: "Linux", href: "/linux" },
        { label: "macOS", href: "/macos" },
      ],
    });

    const html = renderHero(parsed);

    expect(html).toContain('c-button--primary" href="/android">Android</a>');
    expect(html).toContain('c-button--secondary" href="/windows">Windows</a>');
    expect(html).toContain('c-button--secondary" href="/linux">Linux</a>');
    expect(html).toContain('c-button--secondary" href="/macos">macOS</a>');
  });

  it("resolves background image paths through the render context", () => {
    const parsed = HeroSchema.parse({
      type: "hero",
      headline: "Built for custom rooms",
      primaryCta: {
        label: "Call now",
        href: "tel:+15555555555",
      },
      backgroundImage: {
        src: "/content/images/generated-hero.png",
      },
    });

    const html = renderHero(parsed, {
      resolveImage: () => ({
        src: "assets/images/generated-hero-hero-background-2400.avif?v=1234",
      }),
      resolveGalleryImage: () => ({
        src: "",
      }),
    });

    expect(html).toContain(
      "url('assets/images/generated-hero-hero-background-2400.avif?v=1234')",
    );
  });

  it("rejects unsafe background positioning", () => {
    const parsed = HeroSchema.safeParse({
      type: "hero",
      headline: "Built for custom rooms",
      primaryCta: {
        label: "Call now",
        href: "tel:+15555555555",
      },
      backgroundImage: {
        src: "/content/images/generated-hero.png",
        position: "center; color: red",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unknown fields and missing CTAs", () => {
    const extraField = HeroSchema.safeParse({
      type: "hero",
      headline: "Launch faster",
      buttonText2: "Bad field",
      primaryCta: {
        label: "Start",
        href: "/start",
      },
    });

    expect(extraField.success).toBe(false);
    if (extraField.success) {
      return;
    }

    expect(extraField.error.issues[0]?.code).toBe("unrecognized_keys");

    const noCta = HeroSchema.safeParse({
      type: "hero",
      headline: "Launch faster",
    });

    expect(noCta.success).toBe(false);
    if (noCta.success) {
      return;
    }

    expect(noCta.error.issues.some((issue) => issue.message.includes("CTA"))).toBe(
      true,
    );
  });
});

