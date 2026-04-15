import { createThemeDefinition } from "./tokens.js";

export const corporateTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#fcfcfd",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#f1f5f9",
    "--color-text": "#020617",
    "--color-text-muted": "#475569",
    "--color-border": "rgb(15 23 42 / 0.08)",
    "--color-primary": "#0f172a",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#2563eb",
    "--color-link": "#2563eb",
    "--color-link-hover": "#1d4ed8",
    "--color-focus-ring": "#2563eb",
    "--page-background": "#fcfcfd",
    "--surface-background": "#ffffff",
    "--hero-background": "transparent",
    "--cta-background": "#f1f5f9",
    "--navbar-background": "transparent",
    "--font-family-body": "\"Inter\", \"IBM Plex Sans\", sans-serif",
    "--font-family-heading": "\"Inter\", \"IBM Plex Sans\", sans-serif",
    "--heading-letter-spacing": "-0.03em",
    "--font-size-5": "2.25rem",
    "--font-size-6": "3.25rem",
    "--line-height-heading": "1.1",
    "--font-weight-semibold": "600",
    "--font-weight-bold": "700",
    "--button-letter-spacing": "0.01em",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--container-max": "72rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",
    "--shadow-sm": "var(--shadow-subtle)",
    "--shadow-md": "0 12px 24px -4px rgb(15 23 42 / 0.08), 0 4px 8px -4px rgb(15 23 42 / 0.04)",
    "--shadow-lg": "0 20px 48px -12px rgb(15 23 42 / 0.12)",
    "--button-hover-transform": "translateY(-1px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(255 255 255 / 0.8);
      border-bottom: 1px solid var(--color-border);
    }

    .c-hero__body {
      background: transparent;
      box-shadow: none;
      border: none;
      padding-inline: 0;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0);
      background-size: 24px 24px;
      mask-image: radial-gradient(circle at center, black, transparent 80%);
      opacity: 0.4;
      pointer-events: none;
    }

    .c-hero__body > * {
      position: relative;
      z-index: 1;
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      box-shadow: var(--shadow-md);
    }

    .c-cta-band__inner {
      border: none;
      background: var(--color-primary);
      color: var(--color-primary-contrast);
      box-shadow: var(--shadow-lg);
    }

    .c-cta-band__headline {
      color: inherit;
    }

    .c-cta-band__inner .c-button--secondary {
      background: rgb(255 255 255 / 0.1);
      border: 1px solid rgb(255 255 255 / 0.2);
      color: white;
    }
  `,
);
