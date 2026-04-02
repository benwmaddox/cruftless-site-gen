import { createThemeDefinition } from "./tokens.js";

export const heritageLocalTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f7f2e9",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#e7ddcf",
    "--color-text": "#1b1b1b",
    "--color-text-muted": "#5b4a3d",
    "--color-border": "#b89f8a",
    "--color-primary": "#12355b",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#7a1f2b",
    "--color-link": "#12355b",
    "--color-link-hover": "#7a1f2b",
    "--color-focus-ring": "#7a1f2b",
    "--page-background": "linear-gradient(180deg, #f7f2e9 0%, #efe5d5 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "linear-gradient(180deg, #ffffff 0%, #f7f2e9 100%)",
    "--cta-background": "#e7ddcf",
    "--font-family-body": "\"Source Serif 4\", Georgia, serif",
    "--font-family-heading": "\"Cormorant Garamond\", Georgia, serif",
    "--font-size-5": "2.15rem",
    "--font-size-6": "2.8rem",
    "--line-height-heading": "1.04",
    "--line-height-loose": "1.8",
    "--heading-letter-spacing": "-0.01em",
    "--button-letter-spacing": "0.04em",
    "--space-7": "3rem",
    "--space-8": "4rem",
    "--container-max": "70rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",
    "--shadow-sm": "none",
    "--shadow-md": "none",
    "--shadow-lg": "none",
    "--button-hover-transform": "none",
  },
  `
    .c-navbar,
    .c-prose,
    .c-feature-grid,
    .c-faq,
    .c-cta-band {
      position: relative;
    }

    .c-navbar::before,
    .c-prose::before,
    .c-feature-grid::before,
    .c-faq::before,
    .c-cta-band::before {
      content: "";
      display: block;
      width: min(calc(100% - (2 * var(--space-5))), var(--content-max));
      margin: 0 auto var(--space-4);
      border-top: var(--border-width-1) solid rgb(18 53 91 / 0.28);
    }

    .c-hero__body,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-google-maps__frame,
    .c-media__image {
      box-shadow: none;
      border-width: var(--border-width-2);
    }
  `,
);
