import { createThemeDefinition } from "./tokens.js";

export const studioIndustrialTheme = createThemeDefinition(
  {
    "--color-scheme": "dark",
    "--color-bg": "#1b130e",
    "--color-surface": "#f3ede3",
    "--color-surface-alt": "#dfd1bf",
    "--color-text": "#211711",
    "--color-text-muted": "#5f4f45",
    "--color-border": "#8a6d55",
    "--color-primary": "#8f2d18",
    "--color-primary-contrast": "#f8f1e8",
    "--color-accent": "#b3925f",
    "--color-link": "#7a2211",
    "--color-link-hover": "#b13f21",
    "--color-focus-ring": "#d39b4c",
    "--page-background":
      "linear-gradient(rgb(27 19 14 / 0.78), rgb(27 19 14 / 0.88)), var(--site-page-background-image, none) center / cover fixed #1b130e",
    "--surface-background":
      "linear-gradient(180deg, rgb(243 237 227 / 0.97) 0%, rgb(229 219 203 / 0.95) 100%)",
    "--hero-background":
      "linear-gradient(180deg, rgb(247 241 232 / 0.97) 0%, rgb(229 217 199 / 0.95) 100%)",
    "--cta-background": "linear-gradient(135deg, #4a1207 0%, #8f2d18 58%, #b3925f 100%)",
    "--font-family-body": "\"Palatino Linotype\", \"Book Antiqua\", serif",
    "--font-family-heading": "\"Bookman Old Style\", \"Palatino Linotype\", serif",
    "--heading-letter-spacing": "0.04em",
    "--font-size-5": "2.4rem",
    "--font-size-6": "3.7rem",
    "--line-height-heading": "0.96",
    "--font-weight-semibold": "700",
    "--font-weight-bold": "800",
    "--button-letter-spacing": "0.12em",
    "--space-7": "3.5rem",
    "--space-8": "4.5rem",
    "--container-max": "70rem",
    "--content-max": "44rem",
    "--button-height": "3rem",
    "--radius-md": "0.2rem",
    "--radius-lg": "0.55rem",
    "--radius-xl": "0.9rem",
    "--border-width-2": "3px",
    "--shadow-sm": "0 4px 10px rgb(15 9 5 / 0.2)",
    "--shadow-md": "0 14px 40px rgb(10 6 3 / 0.28)",
    "--shadow-lg": "0 24px 56px rgb(10 6 3 / 0.34)",
    "--button-hover-transform": "translateY(-2px)",
  },
  `
    html {
      background-color: #1b130e;
    }

    .l-page {
      padding-block: var(--space-8);
      gap: var(--space-2);
    }

    .c-hero__body,
    .c-feature-grid__item,
    .c-feature-list__item,
    .c-faq__item,
    .c-cta-band__inner,
    .c-media__image {
      border-color: color-mix(in srgb, var(--color-border) 72%, #2d190d);
    }

    .c-hero__body,
    .c-cta-band__inner {
      position: relative;
      overflow: hidden;
    }

    .c-hero__body::before,
    .c-cta-band__inner::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          135deg,
          rgb(255 255 255 / 0.08) 0%,
          rgb(255 255 255 / 0) 30%,
          rgb(80 38 18 / 0.14) 100%
        );
      pointer-events: none;
    }

    .c-hero__headline,
    .c-feature-grid__title,
    .c-feature-list__title,
    .c-prose__title,
    .c-cta-band__headline {
      text-transform: uppercase;
    }

    .c-hero__actions,
    .c-cta-band__actions {
      position: relative;
      z-index: 1;
    }

    .c-button--secondary {
      border-color: var(--color-primary-contrast);
      background: rgb(248 241 232 / 0.08);
      color: var(--color-primary-contrast);
    }

    .c-button--secondary:hover {
      color: var(--color-primary-contrast);
    }

    .c-prose__inner,
    .c-feature-list__inner,
    .c-feature-grid__inner,
    .c-faq__inner {
      padding: var(--space-6);
      border: var(--border-width-1) solid rgb(214 193 167 / 0.45);
      border-radius: var(--radius-xl);
      background: rgb(243 237 227 / 0.95);
      box-shadow: var(--shadow-md);
    }

    .c-media__caption {
      color: rgb(243 237 227 / 0.9);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  `,
);
