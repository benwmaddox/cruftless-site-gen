import type { ThemeDefinition, ThemeTokens } from "./tokens.js";

export const themeStructureNames = ["plain", "panel", "outline", "rule"] as const;
export type ThemeStructureName = (typeof themeStructureNames)[number];

export const secondaryColorSchemeNames = [
  "moss",
  "copper",
  "plum",
  "stone",
  "ochre",
  "berry",
] as const;
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
  stone: {
    "--color-accent": "#77695a",
    "--color-link-hover": "#594d40",
    "--color-focus-ring": "#8a7b6c",
  },
  ochre: {
    "--color-accent": "#8c7336",
    "--color-link-hover": "#6b541f",
    "--color-focus-ring": "#a18849",
  },
  berry: {
    "--color-accent": "#855767",
    "--color-link-hover": "#643a4a",
    "--color-focus-ring": "#9a6c7b",
  },
};

const sectionInnerSelectors = `
    .c-prose__inner,
    .c-feature-grid__inner,
    .c-feature-list__inner,
    .c-faq__inner
`;

const cardSelectors = `
    .c-feature-grid__item,
    .c-feature-list__item,
    .c-faq__item
`;

const framedMediaSelectors = `
    .c-media__image,
    .c-google-maps__frame
`;

const structureCssByName: Record<ThemeStructureName, string> = {
  plain: `
    .c-hero__body,${cardSelectors},${framedMediaSelectors} {
      box-shadow: none;
    }

    .c-hero__body,${cardSelectors} {
      background: transparent;
    }

    .c-cta-band__inner {
      box-shadow: none;
      background: var(--color-surface-alt);
    }
  `,
  panel: `
    ${sectionInnerSelectors} {
      padding: var(--space-5);
      border: var(--border-width-1) solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--surface-background);
      box-shadow: var(--shadow-sm);
    }

    ${cardSelectors} {
      background: var(--color-bg);
    }
  `,
  outline: `
    ${sectionInnerSelectors} {
      padding: var(--space-5);
      border: var(--border-width-1) solid var(--color-border);
      border-radius: var(--radius-lg);
      background: transparent;
    }

    ${cardSelectors},
    ${framedMediaSelectors},
    .c-hero__body,
    .c-cta-band__inner {
      box-shadow: none;
    }

    ${cardSelectors},
    .c-cta-band__inner {
      background: transparent;
    }
  `,
  rule: `
    ${sectionInnerSelectors} {
      padding-inline-start: var(--space-5);
      border-inline-start: var(--border-width-3) solid var(--color-accent);
    }

    ${cardSelectors} {
      border-inline-start: var(--border-width-3) solid var(--color-accent);
      box-shadow: none;
    }

    ${framedMediaSelectors},
    .c-cta-band__inner {
      box-shadow: none;
    }

    .c-cta-band__inner {
      border-inline-start: var(--border-width-3) solid var(--color-accent);
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
