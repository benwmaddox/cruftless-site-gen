import { createThemeDefinition } from "./tokens.js";

export const workshopTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#fffbf4",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#f3e7d4",
    "--color-text": "#2b1d12",
    "--color-text-muted": "#6b4f3b",
    "--color-border": "#dac4aa",
    "--color-primary": "#c3512f",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#2f6f4e",
    "--color-link": "#8f2e1c",
    "--color-link-hover": "#2f6f4e",
    "--color-focus-ring": "#2f6f4e",
    "--page-background": "linear-gradient(180deg, #fffbf4 0%, #f7efe1 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "linear-gradient(180deg, #f9efe2 0%, #fffbf4 100%)",
    "--cta-background": "#f3e7d4",
    "--font-family-body": "\"Public Sans\", \"Helvetica Neue\", sans-serif",
    "--font-family-heading": "\"Source Serif 4\", Georgia, serif",
    "--heading-letter-spacing": "-0.02em",
    "--font-size-5": "2.1rem",
    "--font-size-6": "2.7rem",
    "--line-height-heading": "1.06",
    "--line-height-loose": "1.78",
    "--font-weight-semibold": "700",
    "--button-letter-spacing": "0.03em",
    "--button-secondary-text": "var(--color-text)",
    "--space-6": "2.25rem",
    "--space-7": "3rem",
    "--space-8": "4rem",
    "--container-max": "70rem",
    "--button-height": "2.875rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.625rem",
    "--radius-xl": "0.75rem",
    "--border-width-2": "2px",
    "--shadow-sm": "0 2px 6px rgb(43 29 18 / 0.08)",
    "--shadow-md": "0 8px 20px rgb(43 29 18 / 0.12)",
    "--shadow-lg": "0 16px 24px rgb(43 29 18 / 0.16)",
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
    .c-faq__item::before,
    .c-contact-form__inner::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          135deg,
          rgb(195 81 47 / 0.08) 0,
          rgb(195 81 47 / 0.08) 0.5rem,
          transparent 0.5rem,
          transparent 1rem
        );
      background-size: 1rem 1rem;
      opacity: 0.35;
      pointer-events: none;
    }

    .c-hero__body > *,
    .c-feature-grid__item > *,
    .c-faq__item > *,
    .c-contact-form__inner > * {
      position: relative;
      z-index: 1;
    }

    .c-feature-grid__item,
    .c-faq__item {
      border-top-width: var(--border-width-3);
      border-top-color: var(--color-primary);
    }
  `,
);
