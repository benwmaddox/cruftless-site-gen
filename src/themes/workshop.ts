import { createThemeDefinition } from "./tokens.js";

export const workshopTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#fffbf4",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#f3e7d4",
    "--color-text": "#2b1d12",
    "--color-text-muted": "#6b4f3b",
    "--color-border": "rgb(43 29 18 / 0.12)",
    "--color-primary": "#c3512f",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#2f6f4e",
    "--color-link": "#8f2e1c",
    "--color-link-hover": "#2f6f4e",
    "--color-focus-ring": "#2f6f4e",
    "--page-background": "radial-gradient(at 0% 0%, #fffbf4 0%, #f7efe1 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "transparent",
    "--cta-background": "#f3e7d4",
    "--font-family-body": "\"Public Sans\", sans-serif",
    "--font-family-heading": "\"Source Serif 4\", serif",
    "--heading-letter-spacing": "-0.02em",
    "--font-size-5": "2.25rem",
    "--font-size-6": "3rem",
    "--line-height-heading": "1.1",
    "--line-height-loose": "1.78",
    "--font-weight-semibold": "700",
    "--button-letter-spacing": "0.03em",
    "--button-secondary-text": "var(--color-text)",
    "--space-6": "2.25rem",
    "--space-7": "3.5rem",
    "--space-8": "5rem",
    "--container-max": "70rem",
    "--button-height": "3.125rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",
    "--border-width-2": "2px",
    "--shadow-sm": "var(--shadow-subtle)",
    "--shadow-md": "0 10px 25px -5px rgb(43 29 18 / 0.1)",
    "--shadow-lg": "0 20px 40px -10px rgb(43 29 18 / 0.15)",
    "--button-hover-transform": "translateY(-2px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(255 251 244 / 0.8);
      border-bottom: 1px solid var(--color-border);
    }

    .c-hero__body,
    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .c-hero__body {
      background: transparent;
      box-shadow: none;
      border: none;
    }

    .c-hero__body::before,
    .c-before-after__item::before,
    .c-feature-grid__item::before,
    .c-faq__item::before,
    .c-contact-form__inner::before,
    .c-testimonials__item::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        45deg,
        rgb(43 29 18 / 0.03) 25%,
        transparent 25%,
        transparent 50%,
        rgb(43 29 18 / 0.03) 50%,
        rgb(43 29 18 / 0.03) 75%,
        transparent 75%,
        transparent 100%
      );
      background-size: 8px 8px;
      pointer-events: none;
    }

    .c-feature-grid__item {
      transition: transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      transform: var(--button-hover-transform);
      box-shadow: var(--shadow-md);
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-testimonials__item {
      border-top: var(--border-width-3) solid var(--color-primary);
    }

    .c-button {
      border: none;
      box-shadow: 0 4px 0 rgb(43 29 18 / 0.1);
    }

    .c-button:active {
      transform: translateY(2px);
      box-shadow: none;
    }
  `,
);
