import { createThemeDefinition } from "./tokens.js";

export const brutalismTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#ffffff",
    "--text": "#000000",
    "--muted": "#333333",
    "--primary": "#000000",
    "--primary-fg": "#ffffff",
    "--accent": "#d4f134",
    "--accent-fg": "#000000",
    "--border": "#000000",
    "--surface": "#ffffff",
    "--surface-fg": "#000000",
    "--link": "#000000",
    "--link-hover": "#000000",
    "--focus-ring": "#d4f134",
    "--font-body": "\"Space Grotesk\", sans-serif",
    "--font-heading": "\"Space Grotesk\", sans-serif",
    "--font-mono": "ui-monospace, monospace",
    "--size-sm": "0.875rem",
    "--size-base": "1rem",
    "--size-lg": "1.25rem",
    "--size-xl": "1.5rem",
    "--size-2xl": "2rem",
    "--size-3xl": "3rem",
    "--size-4xl": "4rem",
    "--size-5xl": "6rem",
    "--space-xs": "0.25rem",
    "--space-sm": "0.5rem",
    "--space-md": "1rem",
    "--space-lg": "2rem",
    "--space-xl": "3rem",
    "--space-2xl": "5rem",
    "--radius": "0rem",
    "--theme-pattern": "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 40h40M40 0v40' stroke='%23000000' stroke-opacity='0.15' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E\")",
    "--duration": "0.1s",
    "--ease": "linear",
  },
  `
    .c-navbar {
      border-bottom: 2px solid var(--border);
    }

    .l-page {
      padding-block: var(--space-xs);
      gap: var(--space-xl);
    }

    .l-section,
    .c-button,
    .c-image-text__image,
    .c-media__image {
      border: 2px solid var(--border);
      box-shadow: var(--shadow);
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }

    .l-section:hover,
    .c-button:hover {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 var(--border);
    }

    .c-button--primary:hover {
      background: var(--accent);
      color: var(--text);
    }

    .c-navbar__link:hover {
      background: var(--accent);
      color: var(--text);
    }

    .c-navbar__brand-text,
    .c-navbar__link,
    .c-button {
      text-transform: uppercase;
      font-weight: 800;
    }

    .c-cta-band__inner {
      background: var(--accent);
      color: var(--text);
    }
  `,
);
