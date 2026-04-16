import { createThemeDefinition } from "./tokens.js";

export const corporateTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#fcfcfd",
    "--text": "#020617",
    "--muted": "#475569",
    "--primary": "#0f172a",
    "--primary-fg": "#ffffff",
    "--accent": "#2563eb",
    "--accent-fg": "#ffffff",
    "--border": "rgb(15 23 42 / 0.08)",
    "--surface": "#ffffff",
    "--surface-fg": "#020617",
    "--link": "#2563eb",
    "--link-hover": "#1d4ed8",
    "--focus-ring": "#2563eb",
    "--font-body": "\"IBM Plex Sans\", \"Helvetica Neue\", sans-serif",
    "--font-heading": "\"IBM Plex Sans\", \"Helvetica Neue\", sans-serif",
    "--font-mono": "ui-monospace, monospace",
    "--size-sm": "0.875rem",
    "--size-base": "1rem",
    "--size-lg": "1.125rem",
    "--size-xl": "1.25rem",
    "--size-2xl": "1.5rem",
    "--size-3xl": "2.25rem",
    "--size-4xl": "3.25rem",
    "--size-5xl": "5rem",
    "--space-xs": "0.25rem",
    "--space-sm": "0.5rem",
    "--space-md": "1rem",
    "--space-lg": "2rem",
    "--space-xl": "3.5rem",
    "--space-2xl": "5.5rem",
    "--radius": "0.5rem",
    "--shadow": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "--max-width": "80rem",
    "--theme-pattern": "url(\"data:image/svg+xml,%3Csvg width='100%25' height='2' viewBox='0 0 100%25 2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 1h100%25' stroke='%23000' stroke-opacity='0.08' fill='none'/%3E%3C/svg%3E\")",
  },
  `
    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(255 255 255 / 0.8);
      border-bottom: 1px solid var(--border);
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0);
      background-size: 24px 24px;
      mask-image: radial-gradient(circle at center, black, transparent 80%);
      opacity: 0.4;
      pointer-events: none;
    }

    .c-cta-band__inner .c-button--secondary {
      background: rgb(15 23 42 / 0.05);
      border: 1px solid var(--border);
      color: var(--text);
    }
  `,
);
