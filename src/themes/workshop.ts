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
    "--space-lg": "2.25rem",
    "--space-xl": "3.5rem",
    "--space-2xl": "5rem",
    "--radius": "0.5rem",
    "--shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    "--max-width": "70rem",
  },
  `
    body {
      background: radial-gradient(at 0% 0%, #fffbf4 0%, #f7efe1 100%);
    }

    .c-navbar {
      backdrop-filter: blur(8px);
      background: rgb(255 251 244 / 0.8);
      border-bottom: 1px solid var(--border);
    }

    .c-hero__body::before,
    .c-before-after__item::before,
    .c-feature-grid__item::before,
    .c-faq__item::before,
    .c-contact-form__inner::before,
    .c-testimonials__item::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        45deg,
        rgb(43 29 18 / 0.03) 25%,
        transparent 25%,
        transparent 50%,
        rgb(43 29 18 / 0.03) 50%,
        rgb(43 29 18 / 0.03) 75%,
        transparent 75%,
        transparent 100%
      );
      background-size: 8px 8px;
      pointer-events: none;
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-testimonials__item {
      border-top: 4px solid var(--primary);
      border-radius: 0;
    }

    .c-button {
      box-shadow: 0 4px 0 rgb(43 29 18 / 0.1);
    }

    .c-button:active {
      transform: translateY(2px);
      box-shadow: none;
    }
  `,
);
