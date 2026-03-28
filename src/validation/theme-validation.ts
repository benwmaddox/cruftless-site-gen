import { readFile } from "node:fs/promises";

import type { ThemeDefinition, ThemeTokenName } from "../themes/tokens.js";
import { assertExactThemeTokens, themeTokenSet } from "../themes/tokens.js";
import type { ValidationIssue } from "./site-validation.js";

const CSS_VAR_PATTERN = /var\((--[a-z0-9-]+)/gi;

export const findUnknownCssVarTokens = (css: string): string[] => {
  const foundTokens = new Set<string>();

  for (const match of css.matchAll(CSS_VAR_PATTERN)) {
    foundTokens.add(match[1]);
  }

  return [...foundTokens].filter(
    (tokenName) => !themeTokenSet.has(tokenName as ThemeTokenName),
  );
};

export const validateThemeDefinition = (
  themeName: string,
  theme: ThemeDefinition,
): ValidationIssue[] => {
  try {
    assertExactThemeTokens(theme);
    return [];
  } catch (error) {
    return [
      {
        path: [],
        source: `theme:${themeName}`,
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
};

export const validateCssTokenUsage = async (
  cssPaths: readonly string[],
): Promise<ValidationIssue[]> => {
  const issues: ValidationIssue[] = [];

  for (const cssPath of cssPaths) {
    const css = await readFile(cssPath, "utf8");
    const unknownTokens = findUnknownCssVarTokens(css);

    if (unknownTokens.length === 0) {
      continue;
    }

    issues.push({
      path: [],
      source: cssPath,
      message: `unknown theme token reference(s): ${unknownTokens.join(", ")}`,
    });
  }

  return issues;
};
