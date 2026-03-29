import { describe, expect, it } from "vitest";

import { themes } from "./index.js";
import { assertExactThemeTokens, defaultThemeTokens, themeTokenNames } from "./tokens.js";
import {
  findCruftlessCssPolicyViolations,
  findUnknownCssVarTokens,
  validateThemeDefinition,
} from "../validation/theme-validation.js";

const typographyTokens = new Set([
  "--font-family-body",
  "--font-family-heading",
  "--font-size-5",
  "--font-size-6",
  "--line-height-heading",
  "--heading-letter-spacing",
  "--button-letter-spacing",
]);

const shapeTokens = new Set([
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--button-height",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
  "--button-hover-transform",
]);

const surfaceTokens = new Set([
  "--color-scheme",
  "--page-background",
  "--surface-background",
  "--hero-background",
  "--cta-background",
]);

describe("theme validation", () => {
  it("accepts the registered themes", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(validateThemeDefinition(themeName, theme)).toEqual([]);
      expect(() => assertExactThemeTokens(theme.tokens)).not.toThrow();
    }
  });

  it("keeps every built-in theme distinct beyond color alone", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      const changedNonColorTokens = themeTokenNames.filter(
        (tokenName) =>
          !tokenName.startsWith("--color-") &&
          theme.tokens[tokenName] !== defaultThemeTokens[tokenName],
      );

      expect(
        changedNonColorTokens.some((tokenName) => typographyTokens.has(tokenName)),
        `${themeName} should customize typography tokens`,
      ).toBe(true);
      expect(
        changedNonColorTokens.some((tokenName) => shapeTokens.has(tokenName)),
        `${themeName} should customize shape or motion tokens`,
      ).toBe(true);
      expect(
        changedNonColorTokens.some((tokenName) => surfaceTokens.has(tokenName)),
        `${themeName} should customize gradients or surface treatments`,
      ).toBe(true);
      expect(
        changedNonColorTokens.length,
        `${themeName} should change multiple non-color tokens`,
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it("rejects extra theme tokens and unknown CSS variable usage", () => {
    expect(() =>
      assertExactThemeTokens({
        ...themes["dark-saas"].tokens,
        "--hero-glow-color": "#fff",
      }),
    ).toThrow(/Extra theme tokens/);

    expect(findUnknownCssVarTokens(".demo { color: var(--not-a-token); }")).toEqual([
      "--not-a-token",
    ]);
  });

  it("rejects theme CSS that references unknown tokens", () => {
    expect(
      validateThemeDefinition("demo", {
        tokens: themes.corporate.tokens,
        css: ".demo { color: var(--not-a-token); }",
      }),
    ).toEqual([
      {
        path: [],
        source: "theme:demo",
        message: "unknown theme token reference(s): --not-a-token",
      },
    ]);
  });

  it("rejects cruftless-disallowed CSS properties and vendor prefixes", () => {
    expect(
      findCruftlessCssPolicyViolations(`
        .demo {
          margin-left: 1rem;
          float: left;
          -webkit-user-select: none;
          display: -webkit-box;
        }
      `),
    ).toEqual([
      {
        lineNumber: 3,
        message: "disallowed CSS property 'margin-left' from cruftless policy",
      },
      {
        lineNumber: 4,
        message: "disallowed CSS property 'float' from cruftless policy",
      },
      {
        lineNumber: 5,
        message: "vendor-prefixed property '-webkit-user-select' is not allowed",
      },
      {
        lineNumber: 6,
        message: "vendor-prefixed value '-webkit-box' is not allowed",
      },
    ]);
  });
});
