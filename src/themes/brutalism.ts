import { createThemeDefinition } from "./tokens.js";

export const brutalismTheme = createThemeDefinition({
  "--color-bg": "#fff7e8",
  "--color-surface": "#ffffff",
  "--color-surface-alt": "#ffe0a8",
  "--color-text": "#0b0b0b",
  "--color-text-muted": "#2d2d2d",
  "--color-border": "#0b0b0b",
  "--color-primary": "#ff4d00",
  "--color-primary-contrast": "#111111",
  "--color-accent": "#ffd400",
  "--color-link": "#111111",
  "--color-link-hover": "#ff4d00",
  "--color-focus-ring": "#ff4d00",
  "--gradient-page":
    "linear-gradient(180deg, #fff7e8 0%, #fff7e8 72%, #ffd400 72%, #ffd400 100%)",
  "--gradient-surface":
    "linear-gradient(135deg, #ffffff 0%, #ffffff 76%, #ffe0a8 76%, #ffe0a8 100%)",
  "--gradient-cta":
    "linear-gradient(135deg, #ff4d00 0%, #ff4d00 70%, #ffd400 70%, #ffd400 100%)",
  "--font-family-body": "\"Trebuchet MS\", \"Arial Narrow\", Arial, sans-serif",
  "--font-family-heading": "\"Arial Black\", \"Helvetica Neue\", Arial, sans-serif",
  "--letter-spacing-tight": "-0.05em",
  "--font-weight-semibold": "700",
  "--font-weight-bold": "800",
  "--radius-sm": "0",
  "--radius-md": "0",
  "--radius-lg": "0",
  "--radius-xl": "0",
  "--border-width-2": "3px",
  "--border-width-3": "4px",
  "--shadow-sm": "4px 4px 0 rgb(0 0 0 / 1)",
  "--shadow-md": "8px 8px 0 rgb(0 0 0 / 1)",
  "--shadow-lg": "12px 12px 0 rgb(0 0 0 / 1)",
  "--button-letter-spacing": "0.08em",
});
