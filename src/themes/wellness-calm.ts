import { createThemeDefinition } from "./tokens.js";

export const wellnessCalmTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f6fbf8",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#d4f0e6",
    "--color-text": "#13201b",
    "--color-text-muted": "#3e5b50",
    "--color-border": "#b8d0c7",
    "--color-primary": "#2f7c64",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#d97e5d",
    "--color-link": "#1e6250",
    "--color-link-hover": "#2f7c64",
    "--color-focus-ring": "#2f7c64",
    "--page-background": "linear-gradient(180deg, #f6fbf8 0%, #eef8f3 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "linear-gradient(180deg, #d4f0e6 0%, #f6fbf8 100%)",
    "--cta-background": "linear-gradient(180deg, #ffffff 0%, #e8f5ee 100%)",
    "--font-family-body": "\"Nunito Sans\", \"Avenir Next\", sans-serif",
    "--font-family-heading": "\"Nunito Sans\", \"Avenir Next\", sans-serif",
    "--font-size-5": "2.15rem",
    "--font-size-6": "2.8rem",
    "--line-height-heading": "1.04",
    "--line-height-loose": "1.85",
    "--heading-letter-spacing": "-0.025em",
    "--button-letter-spacing": "0.015em",
    "--space-6": "2.25rem",
    "--space-7": "3.5rem",
    "--space-8": "4.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "0.75rem",
    "--shadow-sm": "0 2px 6px rgb(19 32 27 / 0.06)",
    "--shadow-md": "0 10px 22px rgb(19 32 27 / 0.1)",
    "--shadow-lg": "0 16px 24px rgb(19 32 27 / 0.12)",
    "--duration-normal": "220ms",
    "--duration-slow": "260ms",
    "--button-hover-transform": "none",
  },
  `
    .c-hero__body,
    .c-cta-band__inner {
      background:
        linear-gradient(180deg, rgb(212 240 230 / 0.88), rgb(246 251 248 / 0.98));
    }

    .c-feature-grid__item,
    .c-faq__item,
    .c-before-after__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      border-color: rgb(47 124 100 / 0.18);
    }

    .c-logo-strip__link,
    .c-image-text__image,
    .c-gallery__image,
    .c-testimonials__avatar {
      border-color: rgb(47 124 100 / 0.18);
    }

    .c-prose__inner,
    .c-before-after__inner,
    .c-feature-list__inner,
    .c-faq__inner,
    .c-testimonials__inner {
      gap: var(--space-5);
    }
  `,
);
