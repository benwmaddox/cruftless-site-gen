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

    expect(html).toContain('<section class="c-hero c-hero--align-center">');
    expect(html).toContain("&lt;faster&gt;");
    expect(html).toContain("/start?x=%3Ctag%3E");
    expect(html).not.toContain("<faster>");
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

