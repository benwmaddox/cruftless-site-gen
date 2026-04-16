import { createThemeDefinition } from "./tokens.js";

export const highVisServiceTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--bg": "#0a0c10",
    "--text": "#ffffff",
    "--muted": "#94a3b8",
    "--primary": "#ffd400",
    "--primary-fg": "#0a0c10",
    "--accent": "#ff6b00",
    "--accent-fg": "#ffffff",
    "--border": "rgb(255 212 0 / 0.15)",
    "--surface": "#14181e",
    "--surface-fg": "#ffffff",
    "--link": "#ffd400",
    "--link-hover": "#fff3b0",
    "--focus-ring": "#ffd400",
    "--font-body": "\"Archivo\", sans-serif",
    "--font-heading": "\"Archivo\", sans-serif",
    "--font-mono": "\"IBM Plex Mono\", monospace",
    "--size-sm": "0.875rem",
    "--size-base": "1rem",
    "--size-lg": "1.125rem",
    "--size-xl": "1.25rem",
    "--size-2xl": "1.5rem",
    "--size-3xl": "3rem",
    "--size-4xl": "4rem",
    "--size-5xl": "6rem",
    "--space-xs": "0.25rem",
    "--space-sm": "0.5rem",
    "--space-md": "1rem",
    "--space-lg": "2rem",
    "--space-xl": "3rem",
    "--space-2xl": "5rem",
    "--radius": "0.25rem",
    "--shadow": "0 4px 20px rgb(0 0 0 / 0.4)",
    "--max-width": "80rem",
    "--theme-pattern": "repeating-linear-gradient(-45deg, rgb(255 212 0 / 0.15) 0 1rem, transparent 1rem 2rem)",
  },
  `
    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(10 12 16 / 0.85);
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
    }

    .l-page {
      padding-block: var(--space-md);
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 800;
    }

    .c-button--primary {
      box-shadow: 0 4px 0 rgb(204 170 0);
    }

    .c-button--primary:active {
      transform: translateY(2px);
      box-shadow: none;
    }

    .c-cta-band__inner {
      background: var(--primary);
      color: var(--primary-fg);
      box-shadow: 0 20px 40px rgb(255 212 0 / 0.15);
    }
  `,
);
