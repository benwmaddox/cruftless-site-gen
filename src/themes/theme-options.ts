import type { ThemeDefinition, ThemeTokens } from "./tokens.js";

export interface ThemeOverrides {
  cssVariables?: Partial<ThemeTokens>;
}

export const resolveThemeDefinition = (
  theme: ThemeDefinition,
  overrides?: ThemeOverrides,
): ThemeDefinition => {
  return {
    tokens: {
      ...theme.tokens,
      ...overrides?.cssVariables,
    },
    css: theme.css?.trim() || undefined,
  };
};
