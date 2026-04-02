import { createThemeDefinition } from "./tokens.js";

export const friendlyModernTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f8faff",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#dbeafe",
    "--color-text": "#111827",
    "--color-text-muted": "#4b5563",
    "--color-border": "#c7d2fe",
    "--color-primary": "#2563eb",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#e11d48",
    "--color-link": "#2563eb",
    "--color-link-hover": "#1d4ed8",
    "--color-focus-ring": "#2563eb",
    "--page-background": "linear-gradient(180deg, #f8faff 0%, #eef4ff 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "linear-gradient(145deg, #ffffff 0%, #dbeafe 100%)",
    "--cta-background": "linear-gradient(145deg, #ffffff 0%, #ffe4e6 100%)",
    "--font-family-body": "\"Manrope\", \"Avenir Next\", sans-serif",
    "--font-family-heading": "\"Manrope\", \"Avenir Next\", sans-serif",
    "--heading-letter-spacing": "-0.03em",
    "--font-size-5": "2.3rem",
    "--font-size-6": "3rem",
    "--line-height-heading": "1.02",
    "--line-height-loose": "1.75",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "800",
    "--button-letter-spacing": "0.015em",
    "--space-7": "3.25rem",
    "--space-8": "4.25rem",
    "--button-height": "2.875rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "0.75rem",
    "--shadow-sm": "0 2px 6px rgb(17 24 39 / 0.08)",
    "--shadow-md": "0 10px 24px rgb(17 24 39 / 0.12)",
    "--shadow-lg": "0 16px 24px rgb(17 24 39 / 0.14)",
    "--duration-normal": "220ms",
    "--duration-slow": "260ms",
    "--ease-emphasized": "cubic-bezier(0.2, 0.8, 0.2, 1)",
    "--button-hover-transform": "none",
  },
  `
    .c-hero__body,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner {
      position: relative;
      overflow: hidden;
    }

    .c-hero__body::before,
    .c-feature-grid__item::before,
    .c-faq__item::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top right, rgb(37 99 235 / 0.12), transparent 42%),
        radial-gradient(circle at bottom left, rgb(225 29 72 / 0.1), transparent 38%);
      pointer-events: none;
    }

    .c-hero__body > *,
    .c-feature-grid__item > *,
    .c-faq__item > * {
      position: relative;
      z-index: 1;
    }

    .c-navbar__link,
    .c-button {
      border-radius: 999px;
    }
  `,
);
