import { createThemeDefinition } from "./tokens.js";

export const refinedProfessionalTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#080a0c",
    "--color-surface": "#111418",
    "--color-surface-alt": "#1a1e23",
    "--color-text": "#f8fafc",
    "--color-text-muted": "#94a3b8",
    "--color-border": "rgb(201 162 39 / 0.15)",
    "--color-primary": "#c9a227",
    "--color-primary-contrast": "#080a0c",
    "--color-accent": "#e2c46a",
    "--color-link": "#c9a227",
    "--color-link-hover": "#e2c46a",
    "--color-success": "#4d886f",
    "--color-warning": "#c9a227",
    "--color-danger": "#c26d5a",
    "--color-focus-ring": "#c9a227",
    "--page-background": "#080a0c",
    "--surface-background": "#111418",
    "--hero-background": "transparent",
    "--cta-background": "#111418",
    "--font-family-body": "\"Work Sans\", sans-serif",
    "--font-family-heading": "\"Cormorant Garamond\", serif",
    "--font-size-5": "2.5rem",
    "--font-size-6": "3.5rem",
    "--heading-letter-spacing": "-0.01em",
    "--line-height-heading": "1.05",
    "--line-height-loose": "1.75",
    "--font-weight-semibold": "600",
    "--button-letter-spacing": "0.1em",
    "--space-6": "2.25rem",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--container-max": "66rem",
    "--button-height": "3rem",
    "--radius-md": "0.125rem",
    "--radius-lg": "0.25rem",
    "--radius-xl": "0.5rem",
    "--shadow-sm": "0 4px 20px rgb(0 0 0 / 0.4)",
    "--shadow-md": "0 10px 40px rgb(0 0 0 / 0.5)",
    "--shadow-lg": "0 20px 60px rgb(0 0 0 / 0.6)",
    "--duration-fast": "140ms",
    "--duration-normal": "220ms",
    "--button-hover-transform": "translateY(-1px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-lg));
      background: rgb(8 10 12 / 0.85);
      border-bottom: 1px solid var(--color-border);
      text-transform: uppercase;
    }

    .c-hero__body {
      background: transparent;
      padding-block: var(--space-8);
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgb(201 162 39 / 0.08), transparent 70%);
      pointer-events: none;
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-cta-band__inner,
    .c-testimonials__item {
      border: 1px solid var(--color-border);
      background: linear-gradient(145deg, #111418, #0c0f12);
      transition: border-color var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      border-color: var(--color-primary);
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 500;
    }

    .c-button--primary {
      background: var(--color-primary);
      box-shadow: 0 0 20px rgb(201 162 39 / 0.2);
    }

    .c-button--secondary {
      border: 1px solid var(--color-primary);
      background: transparent;
      color: var(--color-primary);
    }
  `,
);
