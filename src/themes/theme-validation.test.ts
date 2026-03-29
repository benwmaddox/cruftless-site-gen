import { describe, expect, it } from "vitest";

import { themes } from "./index.js";
import { assertExactThemeTokens, defaultThemeTokens } from "./tokens.js";
import {
  findCruftlessCssPolicyViolations,
  findUnknownCssVarTokens,
  validateThemeDefinition,
} from "../validation/theme-validation.js";

describe("theme validation", () => {
  it("accepts the registered themes", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(validateThemeDefinition(themeName, theme)).toEqual([]);
      expect(() => assertExactThemeTokens(theme)).not.toThrow();
    }
  });

  it("keeps every theme visually distinct beyond color", () => {
    const typographyTokens = [
      "--font-family-body",
      "--font-family-heading",
      "--font-size-5",
      "--font-size-6",
      "--letter-spacing-tight",
    ] as const;
    const surfaceTokens = [
      "--radius-md",
      "--radius-lg",
      "--radius-xl",
      "--shadow-sm",
      "--shadow-md",
      "--button-letter-spacing",
    ] as const;
    const gradientTokens = ["--gradient-page", "--gradient-surface", "--gradient-cta"] as const;

    for (const [themeName, theme] of Object.entries(themes)) {
      expect(
        typographyTokens.some((tokenName) => theme[tokenName] !== defaultThemeTokens[tokenName]),
        `${themeName} should change at least one typography token`,
      ).toBe(true);
      expect(
        surfaceTokens.some((tokenName) => theme[tokenName] !== defaultThemeTokens[tokenName]),
        `${themeName} should change at least one surface or control token`,
      ).toBe(true);
      expect(
        gradientTokens.some((tokenName) => theme[tokenName] !== defaultThemeTokens[tokenName]),
        `${themeName} should change at least one gradient token`,
      ).toBe(true);
    }
  });

  it("rejects extra theme tokens and unknown CSS variable usage", () => {
    expect(() =>
      assertExactThemeTokens({
        ...themes["dark-saas"],
        "--hero-glow-color": "#fff",
      }),
    ).toThrow(/Extra theme tokens/);

    expect(findUnknownCssVarTokens(".demo { color: var(--not-a-token); }")).toEqual([
      "--not-a-token",
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
