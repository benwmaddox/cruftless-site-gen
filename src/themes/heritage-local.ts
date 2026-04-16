import { createThemeDefinition } from "./tokens.js";

export const heritageLocalTheme = createThemeDefinition(
  {
    "--color-scheme": "light",
    "--bg": "#f9f7f2",
    "--text": "#1a1a1a",
    "--muted": "#5b4a3d",
    "--primary": "#12355b",
    "--primary-fg": "#ffffff",
    "--accent": "#7a1f2b",
    "--accent-fg": "#ffffff",
    "--border": "rgb(184 159 138 / 0.2)",
    "--surface": "#ffffff",
    "--surface-fg": "#1a1a1a",
    "--link": "#12355b",
    "--link-hover": "#7a1f2b",
    "--focus-ring": "#7a1f2b",
    "--font-body": "\"Source Serif 4\", serif",
    "--font-heading": "\"Cormorant Garamond\", serif",
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
    "--radius": "0.25rem",
    "--shadow": "0 2px 4px rgb(0 0 0 / 0.05)",
    "--max-width": "70rem",
  },
  `
    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(249 247 242 / 0.85);
      border-bottom: 1px solid var(--border);
    }

    .c-hero__body {
      padding-block: var(--space-2xl);
    }

    .c-hero__body::after {
      content: "";
      display: block;
      width: 4rem;
      height: 1px;
      background: var(--border);
      margin: var(--space-lg) auto 0;
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 500;
      border-radius: 0;
    }

    .c-button--secondary {
      border: 1px solid var(--border);
    }
  `,
);
