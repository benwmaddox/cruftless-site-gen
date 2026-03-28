import { describe, expect, it } from "vitest";

import { themes } from "./index.js";
import { assertExactThemeTokens } from "./tokens.js";
import { findUnknownCssVarTokens, validateThemeDefinition } from "../validation/theme-validation.js";

describe("theme validation", () => {
  it("accepts the registered themes", () => {
    for (const [themeName, theme] of Object.entries(themes)) {
      expect(validateThemeDefinition(themeName, theme)).toEqual([]);
      expect(() => assertExactThemeTokens(theme)).not.toThrow();
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
});

