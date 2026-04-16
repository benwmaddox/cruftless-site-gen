import { createThemeDefinition } from "./tokens.js";

export const friendlyModernTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#f8faff",
    "--text": "#111827",
    "--muted": "#4b5563",
    "--primary": "#2563eb",
    "--primary-fg": "#ffffff",
    "--accent": "#e11d48",
    "--accent-fg": "#ffffff",
    "--border": "rgb(37 99 235 / 0.12)",
    "--surface": "#ffffff",
    "--surface-fg": "#111827",
    "--link": "#2563eb",
    "--link-hover": "#1d4ed8",
    "--focus-ring": "#2563eb",
    "--font-body": "\"Manrope\", sans-serif",
    "--font-heading": "\"Manrope\", sans-serif",
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
    "--space-xl": "3.25rem",
    "--space-2xl": "5rem",
    "--radius": "1rem",
    "--shadow": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "--max-width": "80rem",
  },
  `
    body {
      background: radial-gradient(at 0% 0%, #f8faff 0%, #eef4ff 100%);
    }

    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(255 255 255 / 0.7);
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgb(37 99 235 / 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgb(225 29 72 / 0.06) 0%, transparent 50%);
      filter: blur(40px);
      z-index: -1;
    }

    .c-feature-grid__item:hover {
      transform: translateY(-4px);
    }

    .c-button {
      border-radius: 999px;
    }
  `,
);
