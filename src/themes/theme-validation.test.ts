import { describe, expect, it } from "vitest";

import { themes } from "./index.js";
import {
  resolveThemeDefinition,
} from "./theme-options.js";
import { assertExactThemeTokens, defaultThemeTokens, themeTokenNames } from "./tokens.js";
import {
  findUnknownCssVarTokens,
  validateThemeDefinition,
} from "../validation/theme-validation.js";

const typographyTokens = new Set([
  "--font-body",
  "--font-heading",
  "--size-3xl",
  "--size-4xl",
]);

const shapeTokens = new Set([
  "--radius",
  "--shadow",
]);

const colorTokens = new Set([
  "--bg",
  "--text",
  "--primary",
  "--accent",
]);

describe("theme validation", () => {
  it("accepts the registered themes", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(validateThemeDefinition(themeName, theme)).toEqual([]);
      expect(() => assertExactThemeTokens(theme.tokens)).not.toThrow();
    }
  });

  it("keeps max-width at 80rem by default", () => {
    expect(defaultThemeTokens["--max-width"]).toBe("80rem");
  });

  it("keeps every built-in theme distinct", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      const changedTokens = themeTokenNames.filter(
        (tokenName) =>
          theme.tokens[tokenName] !== defaultThemeTokens[tokenName],
      );

      expect(
        changedTokens.length,
        `${themeName} should change multiple tokens`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it("rejects extra theme tokens and unknown CSS variable usage", () => {
    expect(() =>
      assertExactThemeTokens({
        ...themes.corporate.tokens,
        "--hero-glow-color": "#fff",
      }),
    ).toThrow(/Extra theme tokens/);

    expect(findUnknownCssVarTokens(".demo { color: var(--not-a-token); }")).toEqual([
      "--not-a-token",
    ]);
    expect(
      findUnknownCssVarTokens(
        ".demo { background-image: var(--site-page-background-image, none); }",
      ),
    ).toEqual([]);
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
    }
  });

  it("applies explicit css variable overrides", () => {
    const resolvedTheme = resolveThemeDefinition(themes.corporate, {
      cssVariables: {
        "--primary": "#ff5500",
        "--space-md": "2.25rem",
      },
    });

    expect(resolvedTheme.tokens["--primary"]).toBe("#ff5500");
    expect(resolvedTheme.tokens["--space-md"]).toBe("2.25rem");
    expect(resolvedTheme.tokens["--text"]).toBe(themes.corporate.tokens["--text"]);
  });
});
