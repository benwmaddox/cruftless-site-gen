import { createThemeDefinition } from "./tokens.js";

export const heritageLocalTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f9f7f2",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#ede8df",
    "--color-text": "#1a1a1a",
    "--color-text-muted": "#5b4a3d",
    "--color-border": "rgb(184 159 138 / 0.2)",
    "--color-primary": "#12355b",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#7a1f2b",
    "--color-link": "#12355b",
    "--color-link-hover": "#7a1f2b",
    "--color-focus-ring": "#7a1f2b",
    "--page-background": "#f9f7f2",
    "--surface-background": "#ffffff",
    "--hero-background": "transparent",
    "--cta-background": "#ede8df",
    "--font-family-body": "\"Source Serif 4\", serif",
    "--font-family-heading": "\"Cormorant Garamond\", serif",
    "--font-size-5": "2.5rem",
    "--font-size-6": "3.5rem",
    "--line-height-heading": "1.1",
    "--line-height-loose": "1.8",
    "--heading-letter-spacing": "-0.01em",
    "--button-letter-spacing": "0.08em",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--container-max": "70rem",
    "--radius-md": "0.25rem",
    "--radius-lg": "0.375rem",
    "--radius-xl": "0.5rem",
    "--shadow-sm": "var(--shadow-subtle)",
    "--shadow-md": "0 10px 30px rgb(184 159 138 / 0.15)",
    "--shadow-lg": "0 20px 50px rgb(184 159 138 / 0.2)",
    "--button-hover-transform": "translateY(-1px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(249 247 242 / 0.85);
      border-bottom: 1px solid var(--color-border);
    }

    .c-hero__body {
      background: transparent;
      padding-block: var(--space-8);
      border: none;
    }

    .c-hero__body::after {
      content: "";
      display: block;
      width: 4rem;
      height: 1px;
      background: var(--color-border);
      margin: var(--space-6) auto 0;
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      border-color: var(--color-primary);
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 500;
      border-radius: 0;
    }

    .c-button--secondary {
      border: 1px solid var(--color-border);
    }
  `,
);
