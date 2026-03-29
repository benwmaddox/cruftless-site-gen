import { createThemeDefinition } from "./tokens.js";

export const darkSaasTheme = createThemeDefinition({
  "--color-bg": "#0d1117",
  "--color-surface": "#161b22",
  "--color-surface-alt": "#1f2630",
  "--color-text": "#e6edf3",
  "--color-text-muted": "#9da7b3",
  "--color-border": "#2f3945",
  "--color-primary": "#4da3ff",
  "--color-primary-contrast": "#081018",
  "--color-accent": "#8b7dff",
  "--color-link": "#6cb6ff",
  "--color-link-hover": "#9cccff",
  "--color-success": "#2da44e",
  "--color-warning": "#bf8700",
  "--color-danger": "#f85149",
  "--color-focus-ring": "#6cb6ff",
  "--page-gradient":
    "radial-gradient(circle at top, rgb(77 163 255 / 0.18), transparent 28%), linear-gradient(180deg, #0d1117 0%, #081018 100%)",
  "--surface-gradient":
    "linear-gradient(180deg, rgb(31 38 48 / 0.98) 0%, rgb(13 17 23 / 0.98) 100%)",
  "--cta-gradient": "linear-gradient(135deg, #4da3ff 0%, #8b7dff 100%)",
  "--font-family-body": "\"Manrope\", Arial, sans-serif",
  "--font-family-heading": "\"Space Grotesk\", Arial, sans-serif",
  "--heading-letter-spacing": "-0.03em",
  "--radius-md": "0.875rem",
  "--radius-lg": "1.25rem",
  "--radius-xl": "1.75rem",
  "--shadow-sm": "0 1px 2px rgb(0 0 0 / 0.25)",
  "--shadow-md": "0 6px 18px rgb(0 0 0 / 0.35)",
  "--shadow-lg": "0 12px 32px rgb(0 0 0 / 0.45)",
});
