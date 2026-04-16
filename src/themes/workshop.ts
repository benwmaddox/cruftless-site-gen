import { createThemeDefinition } from "./tokens.js";

export const workshopTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#fffbf4",
    "--text": "#2b1d12",
    "--muted": "#6b4f3b",
    "--primary": "#c3512f",
    "--primary-fg": "#ffffff",
    "--accent": "#2f6f4e",
    "--accent-fg": "#ffffff",
    "--border": "rgb(43 29 18 / 0.12)",
    "--surface": "#ffffff",
    "--surface-fg": "#2b1d12",
    "--link": "#8f2e1c",
    "--link-hover": "#2f6f4e",
    "--focus-ring": "#2f6f4e",
    "--font-body": "\"Public Sans\", sans-serif",
    "--font-heading": "\"Source Serif 4\", serif",
    "--font-mono": "monospace",
    "--size-sm": "0.875rem",
    "--size-base": "1rem",
    "--size-lg": "1.125rem",
    "--size-xl": "1.25rem",
    "--size-2xl": "1.5rem",
    "--size-3xl": "2.25rem",
    "--size-4xl": "3rem",
    "--size-5xl": "4.5rem",
    "--space-xs": "0.25rem",
    "--space-sm": "0.5rem",
    "--space-md": "1rem",
    "--space-lg": "2rem",
    "--space-xl": "3rem",
    "--space-2xl": "5rem",
    "--radius": "0.5rem",
    "--shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    "--max-width": "80rem",
    "--theme-pattern": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60h60M60 0v60' stroke='%232b1d12' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E\")",
  },
  `
    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(255 251 244 / 0.8);
      border-bottom: 1px solid var(--border);
    }

    .l-page {
      padding-block: var(--space-md);
    }

    .l-section {
      border-top: 4px solid var(--primary);
      box-shadow: 0 2px 4px rgb(43 29 18 / 0.05);
    }

    .l-item {
      background: var(--bg);
    }

    .c-button {
      box-shadow: 0 4px 0 rgb(43 29 18 / 0.1);
    }

    .c-button:active {
      transform: translateY(2px);
      box-shadow: none;
    }

    .c-cta-band__inner {
      background: var(--accent);
      color: var(--accent-fg);
      border: none;
    }
  `,
);
