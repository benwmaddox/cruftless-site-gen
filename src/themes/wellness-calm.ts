import { createThemeDefinition } from "./tokens.js";

export const wellnessCalmTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#f8fcfb",
    "--text": "#13201b",
    "--muted": "#3e5b50",
    "--primary": "#2f7c64",
    "--primary-fg": "#ffffff",
    "--accent": "#d97e5d",
    "--accent-fg": "#ffffff",
    "--border": "rgb(47 124 100 / 0.1)",
    "--surface": "#ffffff",
    "--surface-fg": "#13201b",
    "--link": "#1e6250",
    "--link-hover": "#2f7c64",
    "--focus-ring": "#2f7c64",
    "--font-body": "\"Nunito Sans\", sans-serif",
    "--font-heading": "\"Nunito Sans\", sans-serif",
    "--font-mono": "monospace",
    "--size-sm": "0.875rem",
    "--size-base": "1rem",
    "--size-lg": "1.125rem",
    "--size-xl": "1.25rem",
    "--size-2xl": "1.75rem",
    "--size-3xl": "2.5rem",
    "--size-4xl": "3.5rem",
    "--size-5xl": "5rem",
    "--space-xs": "0.25rem",
    "--space-sm": "0.5rem",
    "--space-md": "1rem",
    "--space-lg": "2rem",
    "--space-xl": "3.5rem",
    "--space-2xl": "5.5rem",
    "--radius": "1.25rem",
    "--shadow": "0 10px 25px -5px rgb(47 124 100 / 0.1)",
    "--max-width": "80rem",
  },
  `
    body {
      background: radial-gradient(at 0% 0%, #f8fcfb 0%, #eef8f3 100%);
    }

    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(248 252 251 / 0.8);
      border-bottom: 1px solid var(--border);
    }

    .l-page {
      padding-block: var(--space-lg);
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 10% 20%, rgb(47 124 100 / 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgb(217 126 93 / 0.04) 0%, transparent 40%);
      filter: blur(40px);
      z-index: -1;
    }

    .c-button {
      border-radius: 999px;
    }
  `,
);
