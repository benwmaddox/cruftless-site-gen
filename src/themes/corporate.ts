import { createThemeDefinition } from "./tokens.js";

export const corporateTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f5f7fa",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#e6f0ff",
    "--color-text": "#0f172a",
    "--color-text-muted": "#475569",
    "--color-border": "#c6d4e1",
    "--color-primary": "#0b5fff",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#0f766e",
    "--color-link": "#0b5fff",
    "--color-link-hover": "#0a4bd9",
    "--color-focus-ring": "#0b5fff",
    "--page-background": "linear-gradient(180deg, #ffffff 0%, #eef4ff 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)",
    "--cta-background": "linear-gradient(180deg, #f8fbff 0%, #e6f0ff 100%)",
    "--font-family-body": "\"IBM Plex Sans\", \"Helvetica Neue\", sans-serif",
    "--font-family-heading": "\"IBM Plex Sans\", \"Helvetica Neue\", sans-serif",
    "--heading-letter-spacing": "-0.02em",
    "--font-size-5": "2.1rem",
    "--font-size-6": "2.7rem",
    "--line-height-heading": "1.06",
    "--font-weight-semibold": "700",
    "--button-letter-spacing": "0.02em",
    "--space-7": "3rem",
    "--space-8": "4rem",
    "--container-max": "72rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",
    "--shadow-sm": "0 1px 2px rgb(15 23 42 / 0.05)",
    "--shadow-md": "0 6px 16px rgb(15 23 42 / 0.08)",
    "--shadow-lg": "0 12px 24px rgb(15 23 42 / 0.12)",
  },
  `
    .c-navbar {
      border-bottom: var(--border-width-1) solid rgb(11 95 255 / 0.12);
      background:
        linear-gradient(180deg, rgb(255 255 255 / 0.94), rgb(245 249 255 / 0.94));
    }

    .c-hero__body {
      position: relative;
      overflow: hidden;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgb(11 95 255 / 0.08) 0 1px, transparent 1px 1.5rem),
        linear-gradient(rgb(15 118 110 / 0.06) 0 1px, transparent 1px 1.5rem);
      opacity: 0.3;
      pointer-events: none;
    }

    .c-hero__body > * {
      position: relative;
      z-index: 1;
    }

    .c-feature-grid__item--selected {
      box-shadow:
        inset 0 0 0 var(--border-width-1) var(--color-primary),
        var(--shadow-sm);
    }

    .c-image-text__image,
    .c-gallery__image,
    .c-before-after__image,
    .c-testimonials__avatar {
      border-color: rgb(11 95 255 / 0.16);
    }
  `,
);
