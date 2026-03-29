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
  "--page-gradient":
    "linear-gradient(135deg, #fff7e8 0%, #fff7e8 72%, #ffd400 72%, #ffd400 100%)",
  "--surface-gradient":
    "linear-gradient(135deg, #ffffff 0%, #ffffff 84%, #ffe0a8 84%, #ffe0a8 100%)",
  "--cta-gradient":
    "linear-gradient(135deg, #ff4d00 0%, #ff4d00 72%, #ffd400 72%, #ffd400 100%)",
  "--font-family-body": "\"IBM Plex Sans\", Arial, sans-serif",
  "--font-family-heading": "\"Space Grotesk\", Arial, sans-serif",
  "--heading-letter-spacing": "0.06em",
  "--radius-sm": "0",
  "--radius-md": "0",
  "--radius-lg": "0",
  "--radius-xl": "0",
  "--font-size-4": "1.875rem",
  "--font-size-5": "2.5rem",
  "--font-size-6": "3.5rem",
  "--border-width-2": "3px",
  "--border-width-3": "4px",
  "--shadow-sm": "4px 4px 0 rgb(0 0 0 / 1)",
  "--shadow-md": "8px 8px 0 rgb(0 0 0 / 1)",
  "--shadow-lg": "12px 12px 0 rgb(0 0 0 / 1)",
});
