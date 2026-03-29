import { createThemeDefinition } from "./tokens.js";

export const appAnnouncementTheme = createThemeDefinition({
  "--color-bg": "#fff9f1",
  "--color-surface": "#ffffff",
  "--color-surface-alt": "#fff1df",
  "--color-text": "#231815",
  "--color-text-muted": "#64544c",
  "--color-border": "#efcfb0",
  "--color-primary": "#ff6b2c",
  "--color-primary-contrast": "#fff8f1",
  "--color-accent": "#1b998b",
  "--color-link": "#c64a12",
  "--color-link-hover": "#9b3709",
  "--color-focus-ring": "#ff6b2c",
  "--gradient-page":
    "radial-gradient(circle at top right, rgb(255 107 44 / 0.22), transparent 32%), linear-gradient(180deg, #fff9f1 0%, #fff1df 100%)",
  "--gradient-surface": "linear-gradient(180deg, #ffffff 0%, #fff4e8 100%)",
  "--gradient-cta": "linear-gradient(135deg, #ff6b2c 0%, #ff9d5c 45%, #1b998b 100%)",
  "--font-family-body": "\"Gill Sans\", \"Trebuchet MS\", sans-serif",
  "--font-family-heading": "\"Palatino Linotype\", Georgia, serif",
  "--letter-spacing-tight": "-0.04em",
  "--font-size-5": "2.5rem",
  "--font-size-6": "3.5rem",
  "--radius-md": "0.875rem",
  "--radius-lg": "1rem",
  "--radius-xl": "1.5rem",
  "--shadow-sm": "0 3px 8px rgb(60 33 16 / 0.08)",
  "--shadow-md": "0 12px 28px rgb(60 33 16 / 0.14)",
  "--shadow-lg": "0 20px 48px rgb(60 33 16 / 0.18)",
  "--button-letter-spacing": "0.04em",
}, `
body[data-theme="app-announcement"] {
  background:
    radial-gradient(circle at top left, rgb(255 107 44 / 0.18), transparent 24rem),
    radial-gradient(circle at top right, rgb(27 153 139 / 0.14), transparent 22rem),
    linear-gradient(180deg, #fffdf8 0, var(--color-bg) 14rem, var(--color-bg) 100%);
}

body[data-theme="app-announcement"] .c-button {
  border-radius: 999px;
}

body[data-theme="app-announcement"] .c-button--primary {
  background: linear-gradient(135deg, var(--color-primary), #ff9a55);
}

body[data-theme="app-announcement"] .c-hero__body {
  padding: var(--space-7);
  border: var(--border-width-1) solid rgb(255 107 44 / 0.14);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, #ffffff 0, #fff0df 100%);
  box-shadow: var(--shadow-md);
}

body[data-theme="app-announcement"] .c-hero__headline {
  max-width: 11ch;
}

body[data-theme="app-announcement"] .c-feature-grid__item,
body[data-theme="app-announcement"] .c-feature-list__item,
body[data-theme="app-announcement"] .c-faq__item {
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, #ffffff 0, #fff4e8 100%);
}

body[data-theme="app-announcement"] .c-cta-band__inner {
  background: linear-gradient(135deg, var(--color-primary), #ff9f61, var(--color-accent));
}
`);
