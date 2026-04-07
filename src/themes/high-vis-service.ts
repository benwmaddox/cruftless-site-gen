import { createThemeDefinition } from "./tokens.js";

export const highVisServiceTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#0e1116",
    "--color-surface": "#171c23",
    "--color-surface-alt": "#2a3441",
    "--color-text": "#f3f4f6",
    "--color-text-muted": "#a1a1aa",
    "--color-border": "#6b7280",
    "--color-primary": "#ffd400",
    "--color-primary-contrast": "#0e1116",
    "--color-accent": "#ff6b00",
    "--color-link": "#ffd400",
    "--color-link-hover": "#fff3b0",
    "--color-focus-ring": "#ffd400",
    "--page-background": "linear-gradient(180deg, #0e1116 0%, #171c23 100%)",
    "--surface-background": "#171c23",
    "--hero-background": "linear-gradient(180deg, #171c23 0%, #2a3441 100%)",
    "--cta-background": "#171c23",
    "--font-family-body": "\"Archivo\", \"Helvetica Neue\", sans-serif",
    "--font-family-heading": "\"Archivo\", \"Helvetica Neue\", sans-serif",
    "--font-family-mono": "\"IBM Plex Mono\", Consolas, monospace",
    "--font-size-4": "1.9rem",
    "--font-size-5": "2.5rem",
    "--font-size-6": "3.1rem",
    "--line-height-heading": "0.96",
    "--font-weight-medium": "700",
    "--font-weight-semibold": "800",
    "--font-weight-bold": "900",
    "--button-letter-spacing": "0.06em",
    "--space-7": "3rem",
    "--space-8": "4rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",
    "--shadow-sm": "none",
    "--shadow-md": "none",
    "--shadow-lg": "none",
    "--duration-fast": "100ms",
    "--duration-normal": "160ms",
    "--ease-standard": "linear",
    "--button-hover-transform": "none",
  },
  `
    .c-hero__body {
      position: relative;
      overflow: hidden;
      border-width: var(--border-width-2);
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          135deg,
          rgb(255 212 0 / 0.14) 0 0.75rem,
          transparent 0.75rem 1.5rem
        );
      pointer-events: none;
    }

    .c-hero__body > * {
      position: relative;
      z-index: 1;
    }

    .c-navbar__link,
    .c-button,
    .c-feature-grid__item-status {
      text-transform: uppercase;
    }

    .c-feature-grid__item,
    .c-before-after__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-cta-band__inner,
    .c-google-maps__frame,
    .c-gallery__image,
    .c-image-text__image,
    .c-logo-strip__link,
    .c-media__image,
    .c-testimonials__avatar,
    .c-testimonials__item {
      border-width: var(--border-width-2);
      box-shadow: none;
    }
  `,
);
