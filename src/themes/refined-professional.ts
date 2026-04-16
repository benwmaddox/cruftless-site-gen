import { createThemeDefinition } from "./tokens.js";

export const refinedProfessionalTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--bg": "#080a0c",
    "--text": "#f8fafc",
    "--muted": "#94a3b8",
    "--primary": "#c9a227",
    "--primary-fg": "#080a0c",
    "--accent": "#e2c46a",
    "--accent-fg": "#080a0c",
    "--border": "rgb(201 162 39 / 0.15)",
    "--surface": "#111418",
    "--surface-fg": "#f8fafc",
    "--link": "#c9a227",
    "--link-hover": "#e2c46a",
    "--focus-ring": "#c9a227",
    "--font-body": "\"Work Sans\", sans-serif",
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
    "--space-xl": "3rem",
    "--space-2xl": "5rem",
    "--radius": "0.125rem",
    "--shadow": "0 10px 30px -5px rgb(0 0 0 / 0.5)",
    "--max-width": "80rem",
    "--theme-pattern": "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' fill='%23fff' fill-opacity='0.08'/%3E%3C/svg%3E\")",
  },
  `
    .c-navbar {
      backdrop-filter: blur(12px);
      background: rgb(8 10 12 / 0.85);
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
    }

    .c-hero__body::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgb(201 162 39 / 0.08), transparent 70%);
      pointer-events: none;
    }

    .c-button {
      text-transform: uppercase;
      font-weight: 500;
    }

    .c-button--primary {
      background: var(--primary);
      box-shadow: 0 0 20px rgb(201 162 39 / 0.2);
    }

    .c-button--secondary {
      border: 1px solid var(--primary);
      background: transparent;
      color: var(--primary);
    }

    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-contact-form__inner,
    .c-cta-band__inner,
    .c-testimonials__item {
      background: linear-gradient(145deg, #111418, #0c0f12);
    }
  `,
);
