import { createThemeDefinition } from "./tokens.js";

export const studioIndustrialTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#1a1714",
    "--color-surface": "#23201c",
    "--color-surface-alt": "#2c2823",
    "--color-text": "#f0ebe4",
    "--color-text-muted": "#b8ada1",
    "--color-border": "#4a433a",
    "--color-primary": "#9c5d39",
    "--color-primary-contrast": "#fff6ec",
    "--color-accent": "#857257",
    "--color-link": "#c88962",
    "--color-link-hover": "#dfaa82",
    "--color-focus-ring": "#b98a63",
    "--page-background":
      "linear-gradient(rgb(26 23 20 / 0.82), rgb(26 23 20 / 0.82)), var(--site-page-background-image, none) center / cover fixed, #1a1714",
    "--surface-background": "#23201c",
    "--hero-background": "#26231f",
    "--cta-background": "#23201c",
    "--font-family-body": "\"Optima\", \"Avenir Next\", sans-serif",
    "--font-family-heading": "\"Optima\", \"Avenir Next\", sans-serif",
    "--heading-letter-spacing": "0.01em",
    "--font-size-5": "2.15rem",
    "--font-size-6": "3rem",
    "--line-height-heading": "1.05",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "750",
    "--button-letter-spacing": "0.02em",
    "--button-secondary-text": "var(--color-text)",
    "--space-7": "2.75rem",
    "--button-height": "2.625rem",
    "--radius-md": "0.25rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",
    "--border-width-2": "2px",
    "--shadow-sm": "0 1px 2px rgb(0 0 0 / 0.18)",
    "--shadow-md": "0 4px 12px rgb(0 0 0 / 0.18)",
    "--shadow-lg": "0 8px 24px rgb(0 0 0 / 0.22)",
    "--button-hover-transform": "none",
  },
  `
    .l-page {
      gap: var(--space-2);
    }

    .c-prose__inner,
    .c-feature-list__inner,
    .c-feature-grid__inner,
    .c-faq__inner {
      padding-inline-start: var(--space-5);
      border-inline-start: var(--border-width-3) solid var(--color-accent);
    }

    .c-media__caption {
      color: var(--color-text-muted);
    }
  `,
);
