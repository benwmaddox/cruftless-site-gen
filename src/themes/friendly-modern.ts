import { createThemeDefinition } from "./tokens.js";

export const friendlyModernTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--color-bg": "#f8faff",
    "--color-surface": "#ffffff",
    "--color-surface-alt": "#dbeafe",
    "--color-text": "#111827",
    "--color-text-muted": "#4b5563",
    "--color-border": "rgb(37 99 235 / 0.12)",
    "--color-primary": "#2563eb",
    "--color-primary-contrast": "#ffffff",
    "--color-accent": "#e11d48",
    "--color-link": "#2563eb",
    "--color-link-hover": "#1d4ed8",
    "--color-focus-ring": "#2563eb",
    "--page-background": "radial-gradient(at 0% 0%, #f8faff 0%, #eef4ff 100%)",
    "--surface-background": "#ffffff",
    "--hero-background": "transparent",
    "--cta-background": "linear-gradient(145deg, #ffffff 0%, #ffe4e6 100%)",
    "--font-family-body": "\"Manrope\", \"Avenir Next\", sans-serif",
    "--font-family-heading": "\"Manrope\", \"Avenir Next\", sans-serif",
    "--heading-letter-spacing": "-0.03em",
    "--font-size-5": "2.3rem",
    "--font-size-6": "3.5rem",
    "--line-height-heading": "1.05",
    "--line-height-loose": "1.75",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "800",
    "--button-letter-spacing": "0.015em",
    "--space-7": "3.25rem",
    "--space-8": "5rem",
    "--button-height": "3.125rem",
    "--radius-md": "1rem",
    "--radius-lg": "1.5rem",
    "--radius-xl": "2rem",
    "--shadow-sm": "var(--shadow-subtle)",
    "--shadow-md": "0 20px 40px rgb(17 24 39 / 0.08)",
    "--shadow-lg": "0 30px 60px rgb(17 24 39 / 0.12)",
    "--duration-normal": "220ms",
    "--duration-slow": "260ms",
    "--ease-emphasized": "cubic-bezier(0.2, 0.8, 0.2, 1)",
    "--button-hover-transform": "translateY(-2px)",
  },
  `
    .c-hero__body,
    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      position: relative;
      overflow: hidden;
      border: none;
      box-shadow: var(--shadow-subtle);
      background: var(--surface-background);
    }

    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(255 255 255 / 0.7);
      border-bottom: 1px solid var(--color-border);
    }

    .c-hero__body {
      background: transparent;
      box-shadow: none;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgb(37 99 235 / 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgb(225 29 72 / 0.06) 0%, transparent 50%);
      filter: blur(var(--blur-lg));
      z-index: -1;
    }

    .c-feature-grid__item {
      transition: transform var(--duration-normal) var(--ease-emphasized), box-shadow var(--duration-normal) var(--ease-emphasized);
    }

    .c-feature-grid__item:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .c-button {
      border: none;
      box-shadow: 0 4px 12px rgb(37 99 235 / 0.15);
    }

    .c-button--secondary {
      background: rgb(37 99 235 / 0.05);
      color: var(--color-primary);
    }

    .c-navbar__link,
    .c-button {
      border-radius: 999px;
    }
  `,
);
