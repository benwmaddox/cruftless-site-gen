const canonicalThemeTokens = {
  "--color-scheme": "light",
  "--color-bg": "#ffffff",
  "--color-surface": "#f8f8f8",
  "--color-surface-alt": "#efefef",
  "--color-text": "#111111",
  "--color-text-muted": "#555555",
  "--color-border": "#d0d0d0",
  "--color-primary": "#0057ff",
  "--color-primary-contrast": "#ffffff",
  "--color-accent": "#7a3cff",
  "--color-link": "#0057ff",
  "--color-link-hover": "#0041c4",
  "--color-success": "#127a38",
  "--color-warning": "#a15c00",
  "--color-danger": "#b42318",
  "--color-focus-ring": "#1f6fff",
  "--page-background": "var(--color-bg)",
  "--surface-background": "var(--color-surface)",
  "--hero-background": "var(--color-surface)",
  "--cta-background": "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
  "--font-family-body": "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  "--font-family-heading": "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  "--font-family-mono": "\"SFMono-Regular\", Consolas, monospace",
  "--font-size-0": "0.875rem",
  "--font-size-1": "1rem",
  "--font-size-2": "1.125rem",
  "--font-size-3": "1.375rem",
  "--font-size-4": "1.75rem",
  "--font-size-5": "2.25rem",
  "--font-size-6": "3rem",
  "--line-height-tight": "1.1",
  "--line-height-heading": "1.2",
  "--line-height-body": "1.5",
  "--line-height-loose": "1.7",
  "--font-weight-regular": "400",
  "--font-weight-medium": "500",
  "--font-weight-semibold": "600",
  "--font-weight-bold": "700",
  "--letter-spacing-tight": "-0.02em",
  "--letter-spacing-normal": "0",
  "--letter-spacing-wide": "0.04em",
  "--heading-letter-spacing": "-0.02em",
  "--button-letter-spacing": "0",
  "--button-secondary-text": "var(--color-text)",
  "--space-0": "0",
  "--space-1": "0.25rem",
  "--space-2": "0.5rem",
  "--space-3": "0.75rem",
  "--space-4": "1rem",
  "--space-5": "1.5rem",
  "--space-6": "2rem",
  "--space-7": "3rem",
  "--space-8": "4rem",
  "--container-max": "72rem",
  "--content-max": "48rem",
  "--nav-height": "4rem",
  "--button-height": "2.75rem",
  "--input-height": "2.75rem",
  "--icon-size-sm": "1rem",
  "--icon-size-md": "1.25rem",
  "--icon-size-lg": "1.5rem",
  "--radius-none": "0",
  "--radius-sm": "0.25rem",
  "--radius-md": "0.5rem",
  "--radius-lg": "0.75rem",
  "--radius-xl": "1rem",
  "--border-width-1": "1px",
  "--border-width-2": "2px",
  "--border-width-3": "3px",
  "--shadow-none": "none",
  "--shadow-sm": "0 1px 2px rgb(0 0 0 / 0.08)",
  "--shadow-md": "0 6px 18px rgb(0 0 0 / 0.12)",
  "--shadow-lg": "0 12px 32px rgb(0 0 0 / 0.18)",
  "--duration-fast": "120ms",
  "--duration-normal": "180ms",
  "--duration-slow": "260ms",
  "--ease-standard": "ease",
  "--ease-emphasized": "cubic-bezier(0.2, 0, 0, 1)",
  "--button-hover-transform": "translateY(-1px)",
  "--z-base": "1",
  "--z-header": "10",
  "--z-overlay": "100",
  "--z-modal": "1000",
} as const;

export type ThemeTokenName = keyof typeof canonicalThemeTokens;
export type ThemeTokens = Record<ThemeTokenName, string>;
export interface ThemeDefinition {
  tokens: ThemeTokens;
  css?: string;
}

export const themeTokenNames = Object.keys(canonicalThemeTokens) as ThemeTokenName[];
export const themeTokenSet = new Set<ThemeTokenName>(themeTokenNames);

export const allowedThemeOverrideTokens = [
  "--color-primary",
  "--color-primary-contrast",
  "--color-accent",
  "--color-link",
  "--color-link-hover",
  "--color-focus-ring",
] as const satisfies readonly ThemeTokenName[];

export const defaultThemeTokens: ThemeTokens = { ...canonicalThemeTokens };

export const assertExactThemeTokens: (
  theme: Record<string, string>,
) => asserts theme is ThemeTokens = (theme) => {
  const keys = Object.keys(theme);
  const missing = themeTokenNames.filter((name) => !(name in theme));
  const extra = keys.filter((key) => !themeTokenSet.has(key as ThemeTokenName));

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      [
        missing.length > 0 ? `Missing theme tokens: ${missing.join(", ")}` : "",
        extra.length > 0 ? `Extra theme tokens: ${extra.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
};

export const createThemeDefinition = (
  overrides: Partial<ThemeTokens>,
  css?: string,
): ThemeDefinition => {
  const theme: ThemeTokens = {
    ...defaultThemeTokens,
    ...overrides,
  };

  assertExactThemeTokens(theme);
  return {
    tokens: theme,
    css: css?.trim(),
  };
};
