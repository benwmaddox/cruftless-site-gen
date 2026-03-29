import { createThemeDefinition } from "./tokens.js";

export const darkSaasTheme = createThemeDefinition({
  "--color-scheme": "dark",
  "--color-bg": "#0b1020",
  "--color-surface": "#141b2d",
  "--color-surface-alt": "#19233a",
  "--color-text": "#e6edf3",
  "--color-text-muted": "#9da7b3",
  "--color-border": "#2b3855",
  "--color-primary": "#4da3ff",
  "--color-primary-contrast": "#f5f9ff",
  "--color-accent": "#8b7dff",
  "--color-link": "#6cb6ff",
  "--color-link-hover": "#9cccff",
  "--color-success": "#2da44e",
  "--color-warning": "#bf8700",
  "--color-danger": "#f85149",
  "--color-focus-ring": "#6cb6ff",
  "--page-background":
    "radial-gradient(circle at top, rgb(77 163 255 / 0.18), transparent 32%), linear-gradient(180deg, #0b1020 0%, #111827 100%)",
  "--surface-background":
    "linear-gradient(180deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.02)), #141b2d",
  "--hero-background":
    "radial-gradient(circle at top right, rgb(77 163 255 / 0.16), transparent 38%), linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.03))",
  "--cta-background": "linear-gradient(135deg, #1d3b64 0%, #6b5cff 100%)",
  "--font-family-body": "\"Trebuchet MS\", \"Segoe UI\", sans-serif",
  "--font-family-heading": "\"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
  "--line-height-heading": "1.05",
  "--letter-spacing-tight": "-0.03em",
  "--button-letter-spacing": "0.015em",
  "--radius-md": "999px",
  "--radius-lg": "1.25rem",
  "--radius-xl": "1.75rem",
  "--shadow-sm": "0 8px 24px rgb(0 0 0 / 0.22)",
  "--shadow-md": "0 18px 48px rgb(0 0 0 / 0.28)",
  "--shadow-lg": "0 28px 72px rgb(0 0 0 / 0.34)",
  "--button-hover-transform": "translateY(-2px)",
});
