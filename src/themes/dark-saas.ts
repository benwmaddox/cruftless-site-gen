import { createThemeDefinition } from "./tokens.js";

export const darkSaasTheme = createThemeDefinition({
  "--color-bg": "#0d1117",
  "--color-surface": "#161b22",
  "--color-surface-alt": "#1f2630",
  "--color-text": "#e6edf3",
  "--color-text-muted": "#9da7b3",
  "--color-border": "#2f3945",
  "--color-primary": "#4da3ff",
  "--color-primary-contrast": "#081018",
  "--color-accent": "#8b7dff",
  "--color-link": "#6cb6ff",
  "--color-link-hover": "#9cccff",
  "--color-success": "#2da44e",
  "--color-warning": "#bf8700",
  "--color-danger": "#f85149",
  "--color-focus-ring": "#6cb6ff",
  "--gradient-page":
    "radial-gradient(circle at top, rgb(77 163 255 / 0.24), transparent 35%), linear-gradient(180deg, #0d1117 0%, #111927 100%)",
  "--gradient-surface": "linear-gradient(180deg, rgb(33 41 54 / 0.96), rgb(22 27 34 / 0.96))",
  "--gradient-cta": "linear-gradient(135deg, #4da3ff 0%, #8b7dff 100%)",
  "--font-family-body": "\"Segoe UI\", Helvetica, Arial, sans-serif",
  "--font-family-heading": "\"Courier New\", \"SFMono-Regular\", monospace",
  "--font-size-5": "2.35rem",
  "--font-size-6": "3.35rem",
  "--radius-md": "999px",
  "--radius-lg": "1.5rem",
  "--radius-xl": "2rem",
  "--shadow-sm": "0 1px 2px rgb(0 0 0 / 0.25)",
  "--shadow-md": "0 6px 18px rgb(0 0 0 / 0.35)",
  "--shadow-lg": "0 12px 32px rgb(0 0 0 / 0.45)",
  "--button-letter-spacing": "0.05em",
}, `
body[data-theme="dark-saas"] {
  color-scheme: dark;
  background:
    radial-gradient(circle at top, rgb(77 163 255 / 0.18), transparent 28rem),
    radial-gradient(circle at bottom right, rgb(139 125 255 / 0.16), transparent 24rem),
    var(--color-bg);
}

body[data-theme="dark-saas"] .c-button {
  border-radius: 999px;
}

body[data-theme="dark-saas"] .c-button--primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  box-shadow: 0 12px 30px rgb(8 16 24 / 0.35);
}

body[data-theme="dark-saas"] .c-hero__body,
body[data-theme="dark-saas"] .c-feature-grid__item,
body[data-theme="dark-saas"] .c-feature-list__item,
body[data-theme="dark-saas"] .c-faq__item {
  border-color: rgb(255 255 255 / 0.08);
  background: rgb(22 27 34 / 0.88);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    var(--shadow-md);
}

body[data-theme="dark-saas"] .c-hero__body {
  padding: var(--space-7);
  border: var(--border-width-1) solid rgb(255 255 255 / 0.08);
  border-radius: var(--radius-xl);
}

body[data-theme="dark-saas"] .c-hero__headline {
  max-width: 11ch;
  letter-spacing: -0.04em;
}
`);
