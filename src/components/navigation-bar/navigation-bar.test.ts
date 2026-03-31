import { describe, expect, it } from "vitest";

import { renderNavigationBar } from "./navigation-bar.render.js";
import { NavigationBarSchema } from "./navigation-bar.schema.js";

describe("NavigationBarSchema", () => {
  it("renders escaped branding, with the image before the text when both are provided", () => {
    const parsed = NavigationBarSchema.parse({
      type: "navigation-bar",
      brandText: "Launch <Kit>",
      brandImage: {
        src: "/logo.svg?x=<tag>",
        alt: "Launch <logo>",
      },
      links: [
        {
          label: "Pricing & Plans",
          href: "/pricing?tab=<plans>",
        },
        {
          label: "Docs",
          href: "/docs",
        },
      ],
    });

    const html = renderNavigationBar(parsed);

    expect(html).toContain('class="c-navbar"');
    expect(html).toContain('/logo.svg?x=&lt;tag&gt;');
    expect(html).toContain("Launch &lt;Kit&gt;");
    expect(html).toContain('/pricing?tab=&lt;plans&gt;');
    expect(html.indexOf("c-navbar__brand-image")).toBeLessThan(
      html.indexOf("c-navbar__brand-text"),
    );
    const measureMarkup =
      html.match(/<nav class="c-navbar__measure" aria-hidden="true">([\s\S]*?)<\/nav>/)?.[1] ?? "";
    expect(measureMarkup).toContain('<span class="c-navbar__link">Pricing &amp; Plans</span>');
    expect(measureMarkup).not.toContain("<a ");
    expect(html).not.toContain("<Kit>");
  });

  it("allows nav-only layouts and rejects invalid image or extra fields", () => {
    const navOnly = NavigationBarSchema.parse({
      type: "navigation-bar",
      links: [
        {
          label: "Home",
          href: "/",
        },
      ],
    });

    const html = renderNavigationBar(navOnly);
    expect(html).not.toContain("c-navbar__brand");

    const missingAlt = NavigationBarSchema.safeParse({
      type: "navigation-bar",
      brandImage: {
        src: "/logo.svg",
        alt: "",
      },
      links: [
        {
          label: "Home",
          href: "/",
        },
      ],
    });
    expect(missingAlt.success).toBe(false);

    const extraField = NavigationBarSchema.safeParse({
      type: "navigation-bar",
      links: [
        {
          label: "Home",
          href: "/",
        },
      ],
      menuTitle: "Bad field",
    });
    expect(extraField.success).toBe(false);
  });
});
