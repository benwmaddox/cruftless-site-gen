import { describe, expect, it } from "vitest";

import { themes } from "./index.js";
import {
  resolveThemeDefinition,
  secondaryColorSchemeNames,
  themeStructureNames,
} from "./theme-options.js";
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

const bannedFontPattern = /\b(?:Segoe UI|Trebuchet MS|Arial|Inter|Roboto|system-ui)\b/i;

const parseLengthToPx = (value: string): number => {
  if (value === "0") {
    return 0;
  }

  if (value.endsWith("rem")) {
    return Number.parseFloat(value) * 16;
  }

  if (value.endsWith("px")) {
    return Number.parseFloat(value);
  }

  throw new Error(`Unsupported length format: ${value}`);
};

const readShadowBlurPx = (value: string): number | null => {
  if (value === "none") {
    return 0;
  }

  const match = value.match(
    /-?\d+(?:\.\d+)?px\s+-?\d+(?:\.\d+)?px\s+(-?\d+(?:\.\d+)?px)/,
  );

  return match ? Number.parseFloat(match[1]) : null;
};

describe("theme validation", () => {
  it("exposes the full supported override vocabulary", () => {
    expect(themeStructureNames).toEqual([
      "plain",
      "panel",
      "outline",
      "rule",
      "divider",
      "fill",
    ]);
    expect(secondaryColorSchemeNames).toEqual([
      "midnight-canvas",
      "obsidian-depth",
      "slate-noir",
      "carbon-elegance",
      "deep-ocean",
      "charcoal-studio",
      "graphite-pro",
      "void-space",
      "twilight-mist",
      "onyx-matrix",
      "cloud-canvas",
      "pearl-minimal",
      "ivory-studio",
      "linen-soft",
      "porcelain-clean",
      "cream-elegance",
      "arctic-breeze",
      "alabaster-pure",
      "sand-warm",
      "frost-bright",
    ]);
  });

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

  it("keeps built-in themes within the uncodixfy guardrails", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(
        theme.tokens["--font-family-body"],
        `${themeName} should avoid banned body font stacks`,
      ).not.toMatch(bannedFontPattern);
      expect(
        theme.tokens["--font-family-heading"],
        `${themeName} should avoid banned heading font stacks`,
      ).not.toMatch(bannedFontPattern);

      for (const tokenName of ["--radius-md", "--radius-lg", "--radius-xl"] as const) {
        expect(
          parseLengthToPx(theme.tokens[tokenName]),
          `${themeName} should keep ${tokenName} at 12px or below`,
        ).toBeLessThanOrEqual(12);
      }

      for (const tokenName of ["--shadow-sm", "--shadow-md", "--shadow-lg"] as const) {
        const blur = readShadowBlurPx(theme.tokens[tokenName]);
        if (blur !== null) {
          expect(
            blur,
            `${themeName} should keep ${tokenName} within a restrained blur range`,
          ).toBeLessThanOrEqual(24);
        }
      }

      expect(
        theme.tokens["--button-hover-transform"],
        `${themeName} should avoid transform-driven button hover effects`,
      ).toBe("none");

      for (const tokenName of ["--page-background", "--surface-background", "--hero-background"] as const) {
        expect(
          theme.tokens[tokenName],
          `${themeName} should avoid radial gradient backgrounds for ${tokenName}`,
        ).not.toMatch(/radial-gradient/i);
      }
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

  it("accepts every supported override combination", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(validateThemeDefinition(`${themeName}:base`, resolveThemeDefinition(theme))).toEqual(
        [],
      );

      for (const structure of themeStructureNames) {
        expect(
          validateThemeDefinition(
            `${themeName}:structure:${structure}`,
            resolveThemeDefinition(theme, { structure }),
          ),
        ).toEqual([]);
      }

      for (const secondaryColorScheme of secondaryColorSchemeNames) {
        expect(
          validateThemeDefinition(
            `${themeName}:secondary:${secondaryColorScheme}`,
            resolveThemeDefinition(theme, { secondaryColorScheme }),
          ),
        ).toEqual([]);
      }

      for (const structure of themeStructureNames) {
        for (const secondaryColorScheme of secondaryColorSchemeNames) {
          expect(
            validateThemeDefinition(
              `${themeName}:${structure}:${secondaryColorScheme}`,
              resolveThemeDefinition(theme, {
                structure,
                secondaryColorScheme,
              }),
            ),
          ).toEqual([]);
        }
      }
    }
  });

  it("applies structure and secondary color overrides to the resolved theme", () => {
    const resolvedTheme = resolveThemeDefinition(themes.corporate, {
      structure: "fill",
      secondaryColorScheme: "midnight-canvas",
    });

    expect(resolvedTheme.tokens["--color-scheme"]).toBe("dark");
    expect(resolvedTheme.tokens["--color-bg"]).toBe("#0a0e27");
    expect(resolvedTheme.tokens["--color-primary"]).toBe("#6c8eff");
    expect(resolvedTheme.tokens["--color-link"]).toBe("#a78bfa");
    expect(resolvedTheme.tokens["--color-accent"]).toBe("#f472b6");
    expect(resolvedTheme.css).toContain("background: var(--color-surface-alt);");
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
