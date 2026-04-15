import { createThemeDefinition } from "./tokens.js";

export const highVisServiceTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#0a0c10",
    "--color-surface": "#14181e",
    "--color-surface-alt": "#1e242c",
    "--color-text": "#ffffff",
    "--color-text-muted": "#94a3b8",
    "--color-border": "rgb(255 212 0 / 0.15)",
    "--color-primary": "#ffd400",
    "--color-primary-contrast": "#0a0c10",
    "--color-accent": "#ff6b00",
    "--color-link": "#ffd400",
    "--color-link-hover": "#fff3b0",
    "--color-focus-ring": "#ffd400",
    "--page-background": "#0a0c10",
    "--surface-background": "#14181e",
    "--hero-background": "transparent",
    "--cta-background": "#ffd400",
    "--font-family-body": "\"Archivo\", sans-serif",
    "--font-family-heading": "\"Archivo\", sans-serif",
    "--font-family-mono": "\"IBM Plex Mono\", monospace",
    "--font-size-4": "2rem",
    "--font-size-5": "3rem",
    "--font-size-6": "4rem",
    "--line-height-heading": "1.0",
    "--font-weight-medium": "600",
    "--font-weight-semibold": "800",
    "--font-weight-bold": "900",
    "--button-letter-spacing": "0.08em",
    "--space-7": "3.5rem",
    "--space-8": "5.5rem",
    "--radius-md": "0.25rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.75rem",
    "--shadow-sm": "0 4px 20px rgb(0 0 0 / 0.4)",
    "--shadow-md": "0 10px 40px rgb(0 0 0 / 0.5)",
    "--shadow-lg": "0 20px 60px rgb(0 0 0 / 0.6)",
    "--duration-fast": "120ms",
    "--duration-normal": "180ms",
    "--ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
    "--button-hover-transform": "scale(1.02)",
  },
  `
    .c-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-header);
      backdrop-filter: blur(var(--blur-md));
      background: rgb(10 12 16 / 0.85);
      border-bottom: 1px solid var(--color-border);
      text-transform: uppercase;
    }

    .c-hero__body {
      background: transparent;
      border: none;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: 
        repeating-linear-gradient(
          -45deg,
          rgb(255 212 0 / 0.05) 0 1rem,
          transparent 1rem 2rem
        );
      pointer-events: none;
    }

    .c-feature-grid__item,
    .c-before-after__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-testimonials__item {
      border: 1px solid var(--color-border);
      background: var(--surface-background);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--duration-normal) var(--ease-standard), transform var(--duration-normal) var(--ease-standard);
    }

    .c-feature-grid__item:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 800;
      border: none;
    }

    .c-button--primary {
      box-shadow: 0 4px 0 rgb(204 170 0);
    }

    .c-button--primary:active {
      transform: translateY(2px);
      box-shadow: none;
    }

    .c-cta-band__inner {
      background: var(--color-primary);
      color: var(--color-primary-contrast);
      border: none;
      box-shadow: 0 20px 40px rgb(255 212 0 / 0.15);
    }
  `,
);
