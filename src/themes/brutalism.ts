import { createThemeDefinition } from "./tokens.js";

export const brutalismTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#ffffff",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#f4f4f4",
    "--color-text": "#111111",
    "--color-text-muted": "#333333",
    "--color-border": "#000000",
    "--color-primary": "#000000",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#b6ff00",
    "--color-link": "#000000",
    "--color-link-hover": "#ff2da6",
    "--color-focus-ring": "#000000",
    "--page-background": "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "#f4f4f4",
    "--cta-background": "#ffffff",
    "--font-family-body": "\"Space Grotesk\", \"Helvetica Neue\", sans-serif",
    "--font-family-heading": "\"IBM Plex Mono\", \"Space Grotesk\", monospace",
    "--font-size-4": "1.9rem",
    "--font-size-5": "2.6rem",
    "--font-size-6": "3.4rem",
    "--line-height-heading": "0.92",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "800",
    "--heading-letter-spacing": "0.04em",
    "--button-letter-spacing": "0.05em",
    "--space-7": "3.25rem",
    "--space-8": "4.5rem",
    "--button-height": "3rem",
    "--radius-sm": "0",
    "--radius-md": "0",
    "--radius-lg": "0",
    "--radius-xl": "0",
    "--border-width-2": "3px",
    "--border-width-3": "4px",
    "--shadow-sm": "2px 2px 0 rgb(0 0 0 / 1)",
    "--shadow-md": "4px 4px 0 rgb(0 0 0 / 1)",
    "--shadow-lg": "6px 6px 0 rgb(0 0 0 / 1)",
    "--button-hover-transform": "none",
  },
  `
    .c-navbar__link,
    .c-button,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-hero__body,
    .c-cta-band__inner {
      border-width: var(--border-width-2);
      box-shadow: var(--shadow-md);
    }

    .c-navbar__brand-text,
    .c-navbar__link,
    .c-button,
    .c-feature-grid__item-status {
      text-transform: uppercase;
    }

    .c-hero__body {
      background:
        linear-gradient(90deg, rgb(182 255 0 / 0.18) 0 0.875rem, transparent 0.875rem 100%),
        var(--hero-background);
    }
  `,
);
