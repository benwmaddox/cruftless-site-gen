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

  it("keeps non-color theme expression distinct", () => {
    const expressiveTokens = [
      "--page-gradient",
      "--surface-gradient",
      "--cta-gradient",
      "--font-family-heading",
      "--heading-letter-spacing",
      "--radius-lg",
    ] as const;

    for (const theme of Object.values(themes)) {
      const differingExpressiveTokenCount = expressiveTokens.filter(
        (tokenName) => theme[tokenName] !== defaultThemeTokens[tokenName],
      ).length;

      expect(differingExpressiveTokenCount).toBeGreaterThanOrEqual(4);
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
