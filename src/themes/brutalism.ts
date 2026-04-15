import { createThemeDefinition } from "./tokens.js";

export const brutalismTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#ffffff",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#f4f4f4",
    "--color-text": "#000000",
    "--color-text-muted": "#333333",
    "--color-border": "#000000",
    "--color-primary": "#000000",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#c7ff00",
    "--color-link": "#000000",
    "--color-link-hover": "#000000",
    "--color-focus-ring": "#c7ff00",
    "--page-background": "#ffffff",
    "--surface-background": "#ffffff",
    "--hero-background": "#ffffff",
    "--cta-background": "#c7ff00",
    "--font-family-body": "\"Space Grotesk\", sans-serif",
    "--font-family-heading": "\"Space Grotesk\", sans-serif",
    "--font-size-4": "2rem",
    "--font-size-5": "3rem",
    "--font-size-6": "4rem",
    "--line-height-heading": "0.95",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "800",
    "--heading-letter-spacing": "-0.04em",
    "--button-letter-spacing": "0.02em",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--button-height": "3.25rem",
    "--radius-sm": "0.25rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",
    "--border-width-2": "2px",
    "--border-width-3": "4px",
    "--shadow-sm": "3px 3px 0 rgb(0 0 0 / 1)",
    "--shadow-md": "6px 6px 0 rgb(0 0 0 / 1)",
    "--shadow-lg": "10px 10px 0 rgb(0 0 0 / 1)",
    "--button-hover-transform": "translate(-2px, -2px)",
  },
  `
    .c-navbar {
      position: sticky;
      top: var(--space-4);
      z-index: var(--z-header);
      width: min(calc(100% - (2 * var(--space-5))), var(--content-max));
      margin-inline: auto;
      background: rgb(255 255 255 / 0.9);
      backdrop-filter: blur(var(--blur-sm));
      border: var(--border-width-2) solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }

    .c-navbar__link,
    .c-button,
    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-logo-strip__link,
    .c-contact-form__inner,
    .c-cta-band__inner,
    .c-testimonials__item {
      border: var(--border-width-2) solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard);
    }

    .c-button:hover,
    .c-feature-grid__item:hover {
      transform: var(--button-hover-transform);
      box-shadow: var(--shadow-md);
    }

    .c-navbar__brand-text,
    .c-navbar__link,
    .c-button,
    .c-feature-grid__item-status {
      text-transform: uppercase;
      font-weight: var(--font-weight-bold);
    }

    .c-hero__body {
      background: transparent;
      box-shadow: none;
      border: none;
    }

    .c-cta-band__inner {
      background: var(--color-accent);
      color: var(--color-text);
    }
  `,
);
