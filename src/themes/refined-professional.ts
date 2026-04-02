import { createThemeDefinition } from "./tokens.js";

export const refinedProfessionalTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#0b0f14",
    "--color-surface": "#121a23",
    "--color-surface-alt": "#1a2733",
    "--color-text": "#f2f5f7",
    "--color-text-muted": "#a7b0ba",
    "--color-border": "#44525f",
    "--color-primary": "#c9a227",
    "--color-primary-contrast": "#0b0f14",
    "--color-accent": "#2563eb",
    "--color-link": "#e6c35c",
    "--color-link-hover": "#fff0b8",
    "--color-success": "#4d886f",
    "--color-warning": "#c9a227",
    "--color-danger": "#c26d5a",
    "--color-focus-ring": "#fff0b8",
    "--page-background": "linear-gradient(180deg, #0b0f14 0%, #121a23 100%)",
    "--surface-background": "#121a23",
    "--hero-background": "linear-gradient(180deg, #121a23 0%, #1a2733 100%)",
    "--cta-background": "linear-gradient(180deg, #121a23 0%, #101820 100%)",
    "--font-family-body": "\"Work Sans\", \"Helvetica Neue\", sans-serif",
    "--font-family-heading": "\"Cormorant Garamond\", Georgia, serif",
    "--font-size-5": "2rem",
    "--font-size-6": "2.5rem",
    "--heading-letter-spacing": "-0.02em",
    "--line-height-heading": "1.02",
    "--line-height-loose": "1.75",
    "--font-weight-semibold": "700",
    "--button-letter-spacing": "0.05em",
    "--space-6": "2.25rem",
    "--space-7": "3.5rem",
    "--space-8": "4.5rem",
    "--container-max": "66rem",
    "--button-height": "2.625rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",
    "--shadow-sm": "none",
    "--shadow-md": "none",
    "--shadow-lg": "none",
    "--duration-fast": "140ms",
    "--duration-normal": "220ms",
    "--button-hover-transform": "none",
  },
  `
    .c-navbar,
    .c-hero,
    .c-feature-grid,
    .c-faq,
    .c-contact-form,
    .c-cta-band {
      position: relative;
    }

    .c-navbar::after,
    .c-hero::after {
      content: "";
      display: block;
      width: min(calc(100% - (2 * var(--space-5))), var(--content-max));
      margin: 0 auto;
      border-top: var(--border-width-1) solid rgb(201 162 39 / 0.4);
    }

    .c-hero__body,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-cta-band__inner,
    .c-google-maps__frame,
    .c-media__image {
      box-shadow: none;
      border-color: rgb(201 162 39 / 0.35);
    }

    .c-navbar__brand-text,
    .c-feature-grid__item-title,
    .c-faq__question {
      letter-spacing: 0.02em;
    }
  `,
);
