import { describe, expect, it } from "vitest";

import { renderCtaBand } from "./cta-band.render.js";
import { CtaBandSchema } from "./cta-band.schema.js";

describe("CtaBandSchema", () => {
  it("accepts valid content and renders a CTA section", () => {
    const parsed = CtaBandSchema.parse({
      type: "cta-band",
      headline: "Build reviewable static pages",
      body: "Validation first.",
      primaryCta: {
        label: "Read docs",
        href: "/docs",
      },
    });

    const html = renderCtaBand(parsed);

    expect(html).toContain('<section class="c-cta-band l-container l-section">');
    expect(html).toContain("Read docs");
  });

  it("rejects unknown fields and missing primaryCta", () => {
    const extraField = CtaBandSchema.safeParse({
      type: "cta-band",
      headline: "Build reviewable static pages",
      primaryCta: {
        label: "Read docs",
        href: "/docs",
      },
      tone: "loud",
    });

    expect(extraField.success).toBe(false);
    if (extraField.success) {
      return;
    }

    expect(extraField.error.issues[0]?.code).toBe("unrecognized_keys");

    const missingPrimary = CtaBandSchema.safeParse({
      type: "cta-band",
      headline: "Build reviewable static pages",
    });

    expect(missingPrimary.success).toBe(false);
    if (missingPrimary.success) {
      return;
    }

    expect(
      missingPrimary.error.issues.some(
        (issue) => String(issue.path.join(".")) === "primaryCta",
      ),
    ).toBe(true);
  });
});

