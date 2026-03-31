import type { ThemeDefinition, ThemeTokens } from "./tokens.js";

export const themeStructureNames = ["plain", "panel"] as const;
export type ThemeStructureName = (typeof themeStructureNames)[number];

export const secondaryColorSchemeNames = ["moss", "copper", "plum"] as const;
export type SecondaryColorSchemeName = (typeof secondaryColorSchemeNames)[number];

export interface ThemeOverrides {
  structure?: ThemeStructureName;
  secondaryColorScheme?: SecondaryColorSchemeName;
}

const secondaryColorSchemeTokenOverrides: Record<
  SecondaryColorSchemeName,
  Partial<ThemeTokens>
> = {
  moss: {
    "--color-accent": "#5f7147",
    "--color-link-hover": "#445432",
    "--color-focus-ring": "#708456",
  },
  copper: {
    "--color-accent": "#a55f39",
    "--color-link-hover": "#7e4222",
    "--color-focus-ring": "#bf7a4f",
  },
  plum: {
    "--color-accent": "#78566b",
    "--color-link-hover": "#593b4e",
    "--color-focus-ring": "#8c6a80",
  },
};

const structureCssByName: Record<ThemeStructureName, string> = {
  plain: `
    .c-hero__body,
    .c-feature-grid__item,
    .c-feature-list__item,
    .c-faq__item,
    .c-media__image,
    .c-google-maps__frame {
      box-shadow: none;
    }

    .c-hero__body,
    .c-feature-grid__item,
    .c-feature-list__item,
    .c-faq__item {
      background: transparent;
    }

    .c-cta-band__inner {
      box-shadow: none;
      background: var(--color-surface-alt);
    }
  `,
  panel: `
    .c-prose__inner,
    .c-feature-grid__inner,
    .c-feature-list__inner,
    .c-faq__inner {
      padding: var(--space-5);
      border: var(--border-width-1) solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--surface-background);
      box-shadow: var(--shadow-sm);
    }

    .c-feature-grid__item,
    .c-feature-list__item,
    .c-faq__item {
      background: var(--color-bg);
    }
  `,
};

export const resolveThemeDefinition = (
  theme: ThemeDefinition,
  overrides?: ThemeOverrides,
): ThemeDefinition => {
  const secondaryColorSchemeOverrides = overrides?.secondaryColorScheme
    ? secondaryColorSchemeTokenOverrides[overrides.secondaryColorScheme]
    : {};
  const structureCss = overrides?.structure ? structureCssByName[overrides.structure] : "";
  const css = [theme.css?.trim(), structureCss.trim()].filter(Boolean).join("\n\n");

  return {
    tokens: {
      ...theme.tokens,
      ...secondaryColorSchemeOverrides,
    },
    css: css || undefined,
  };
};
