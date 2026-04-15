import { createThemeDefinition } from "./tokens.js";

export const wellnessCalmTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f8fcfb",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#e8f5f1",
    "--color-text": "#13201b",
    "--color-text-muted": "#3e5b50",
    "--color-border": "rgb(47 124 100 / 0.1)",
    "--color-primary": "#2f7c64",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#d97e5d",
    "--color-link": "#1e6250",
    "--color-link-hover": "#2f7c64",
    "--color-focus-ring": "#2f7c64",
    "--page-background": "radial-gradient(at 0% 0%, #f8fcfb 0%, #eef8f3 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "transparent",
    "--cta-background": "linear-gradient(180deg, #ffffff 0%, #e8f5ee 100%)",
    "--font-family-body": "\"Nunito Sans\", sans-serif",
    "--font-family-heading": "\"Nunito Sans\", sans-serif",
    "--font-size-5": "2.5rem",
    "--font-size-6": "3.5rem",
    "--line-height-heading": "1.1",
    "--line-height-loose": "1.85",
    "--heading-letter-spacing": "-0.03em",
    "--button-letter-spacing": "0.02em",
    "--space-6": "2.25rem",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--radius-md": "1.25rem",
    "--radius-lg": "1.75rem",
    "--radius-xl": "2.5rem",
    "--shadow-sm": "var(--shadow-subtle)",
    "--shadow-md": "0 15px 35px rgb(47 124 100 / 0.08)",
    "--shadow-lg": "0 25px 50px rgb(47 124 100 / 0.12)",
    "--duration-normal": "240ms",
    "--duration-slow": "320ms",
    "--button-hover-transform": "translateY(-2px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(248 252 251 / 0.8);
      border-bottom: 1px solid var(--color-border);
    }

    .c-hero__body {
      background: transparent;
      box-shadow: none;
      border: none;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 10% 20%, rgb(47 124 100 / 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgb(217 126 93 / 0.04) 0%, transparent 40%);
      filter: blur(var(--blur-lg));
      z-index: -1;
    }

    .c-feature-grid__item,
    .c-faq__item,
    .c-before-after__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      border: 1px solid var(--color-border);
      background: var(--surface-background);
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-normal) var(--ease-standard), box-shadow var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      transform: var(--button-hover-transform);
      box-shadow: var(--shadow-md);
    }

    .c-button {
      border: none;
      border-radius: 999px;
      box-shadow: 0 4px 15px rgb(47 124 100 / 0.15);
    }
  `,
);
