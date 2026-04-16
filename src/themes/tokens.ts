const canonicalThemeTokens = {
  "--color-scheme": "light",
  "--bg": "#ffffff",
  "--text": "#111827",
  "--muted": "#6b7280",
  "--primary": "#2563eb",
  "--primary-fg": "#ffffff",
  "--accent": "#f43f5e",
  "--accent-fg": "#ffffff",
  "--border": "#e5e7eb",
  "--surface": "#ffffff",
  "--surface-fg": "#111827",
  "--link": "var(--primary)",
  "--link-hover": "#1d4ed8",
  "--focus-ring": "#3b82f6",

  "--font-body": "system-ui, -apple-system, sans-serif",
  "--font-heading": "system-ui, -apple-system, sans-serif",
  "--font-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",

  "--size-sm": "0.875rem",
  "--size-base": "1rem",
  "--size-lg": "1.125rem",
  "--size-xl": "1.25rem",
  "--size-2xl": "1.5rem",
  "--size-3xl": "2rem",
  "--size-4xl": "3rem",
  "--size-5xl": "4.5rem",

  "--space-xs": "0.25rem",
  "--space-sm": "0.5rem",
  "--space-md": "1rem",
  "--space-lg": "2rem",
  "--space-xl": "4rem",
  "--space-2xl": "8rem",

  "--radius": "0.5rem",
  "--shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "--max-width": "80rem",

  "--duration": "200ms",
  "--ease": "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export type ThemeTokenName = keyof typeof canonicalThemeTokens;
export type ThemeTokens = Record<ThemeTokenName, string>;
export interface ThemeDefinition {
  tokens: ThemeTokens;
  css?: string;
}

export const themeTokenNames = Object.keys(canonicalThemeTokens) as ThemeTokenName[];
export const themeTokenSet = new Set<ThemeTokenName>(themeTokenNames);

export const allowedThemeOverrideTokens = [...themeTokenNames];

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
