import { createThemeDefinition } from "./tokens.js";

export const corporateTheme = createThemeDefinition({
  "--color-bg": "#f7f8fb",
  "--color-surface": "#ffffff",
  "--color-surface-alt": "#eef2f7",
  "--color-text": "#132033",
  "--color-text-muted": "#516074",
  "--color-border": "#c8d2df",
  "--color-primary": "#004e8f",
  "--color-primary-contrast": "#ffffff",
  "--color-accent": "#4f7cac",
  "--color-link": "#004e8f",
  "--color-link-hover": "#003765",
  "--color-focus-ring": "#2f80ed",
  "--gradient-page": "linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
  "--gradient-surface": "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
  "--gradient-cta": "linear-gradient(135deg, #004e8f 0%, #3d78aa 100%)",
  "--font-family-body": "Georgia, \"Times New Roman\", serif",
  "--font-family-heading": "Tahoma, \"Segoe UI\", sans-serif",
  "--letter-spacing-tight": "-0.03em",
  "--radius-md": "0.375rem",
  "--radius-lg": "0.5rem",
  "--radius-xl": "0.75rem",
  "--shadow-sm": "0 1px 2px rgb(16 24 40 / 0.05)",
  "--shadow-md": "0 6px 18px rgb(16 24 40 / 0.1)",
  "--shadow-lg": "0 16px 40px rgb(16 24 40 / 0.12)",
  "--button-letter-spacing": "0.03em",
}, `
body[data-theme="corporate"] {
  background: linear-gradient(180deg, #ffffff 0, var(--color-bg) 14rem, var(--color-bg) 100%);
}

body[data-theme="corporate"] .c-button {
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  font-size: var(--font-size-0);
}

body[data-theme="corporate"] .c-button--primary {
  background: linear-gradient(135deg, #0a5ea8, var(--color-primary));
}

body[data-theme="corporate"] .c-hero__body {
  gap: var(--space-4);
}

body[data-theme="corporate"] .c-hero__headline,
body[data-theme="corporate"] .c-feature-grid__title,
body[data-theme="corporate"] .c-feature-list__title,
body[data-theme="corporate"] .c-faq__title,
body[data-theme="corporate"] .c-cta-band__headline {
  letter-spacing: 0.01em;
}

body[data-theme="corporate"] .c-feature-grid__item,
body[data-theme="corporate"] .c-feature-list__item,
body[data-theme="corporate"] .c-faq__item {
  background: linear-gradient(180deg, #ffffff 0, var(--color-surface-alt) 100%);
  border-color: #b8c6d8;
  box-shadow: none;
}

body[data-theme="corporate"] .c-cta-band__inner {
  border-color: transparent;
  background: linear-gradient(135deg, #0c4b87, #2d6ea8);
}
`);
