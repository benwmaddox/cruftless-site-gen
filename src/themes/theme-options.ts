import type { ThemeDefinition, ThemeTokens } from "./tokens.js";

export const themeStructureNames = [
  "plain",
  "panel",
  "outline",
  "rule",
  "divider",
  "fill",
] as const;
export type ThemeStructureName = (typeof themeStructureNames)[number];

export const secondaryColorSchemeNames = [
  "midnight-canvas",
  "obsidian-depth",
  "slate-noir",
  "carbon-elegance",
  "deep-ocean",
  "charcoal-studio",
  "graphite-pro",
  "void-space",
  "twilight-mist",
  "onyx-matrix",
  "cloud-canvas",
  "pearl-minimal",
  "ivory-studio",
  "linen-soft",
  "porcelain-clean",
  "cream-elegance",
  "arctic-breeze",
  "alabaster-pure",
  "sand-warm",
  "frost-bright",
] as const;
export type SecondaryColorSchemeName = (typeof secondaryColorSchemeNames)[number];

export interface ThemeOverrides {
  structure?: ThemeStructureName;
  secondaryColorScheme?: SecondaryColorSchemeName;
  cssVariables?: Partial<ThemeTokens>;
}

interface SecondaryColorSchemePalette {
  mode: "light" | "dark";
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

const secondaryColorSchemePalettes: Record<
  SecondaryColorSchemeName,
  SecondaryColorSchemePalette
> = {
  "midnight-canvas": {
    mode: "dark",
    background: "#0a0e27",
    surface: "#151b3d",
    primary: "#6c8eff",
    secondary: "#a78bfa",
    accent: "#f472b6",
    text: "#e2e8f0",
  },
  "obsidian-depth": {
    mode: "dark",
    background: "#0f0f0f",
    surface: "#1a1a1a",
    primary: "#00d4aa",
    secondary: "#00a3cc",
    accent: "#ff6b9d",
    text: "#f5f5f5",
  },
  "slate-noir": {
    mode: "dark",
    background: "#0f172a",
    surface: "#1e293b",
    primary: "#38bdf8",
    secondary: "#818cf8",
    accent: "#fb923c",
    text: "#f1f5f9",
  },
  "carbon-elegance": {
    mode: "dark",
    background: "#121212",
    surface: "#1e1e1e",
    primary: "#bb86fc",
    secondary: "#03dac6",
    accent: "#cf6679",
    text: "#e1e1e1",
  },
  "deep-ocean": {
    mode: "dark",
    background: "#001e3c",
    surface: "#0a2744",
    primary: "#4fc3f7",
    secondary: "#29b6f6",
    accent: "#ffa726",
    text: "#eceff1",
  },
  "charcoal-studio": {
    mode: "dark",
    background: "#1c1c1e",
    surface: "#2c2c2e",
    primary: "#0a84ff",
    secondary: "#5e5ce6",
    accent: "#ff375f",
    text: "#f2f2f7",
  },
  "graphite-pro": {
    mode: "dark",
    background: "#18181b",
    surface: "#27272a",
    primary: "#a855f7",
    secondary: "#ec4899",
    accent: "#14b8a6",
    text: "#fafafa",
  },
  "void-space": {
    mode: "dark",
    background: "#0d1117",
    surface: "#161b22",
    primary: "#58a6ff",
    secondary: "#79c0ff",
    accent: "#f78166",
    text: "#c9d1d9",
  },
  "twilight-mist": {
    mode: "dark",
    background: "#1a1625",
    surface: "#2d2438",
    primary: "#9d7cd8",
    secondary: "#7aa2f7",
    accent: "#ff9e64",
    text: "#dcd7e8",
  },
  "onyx-matrix": {
    mode: "dark",
    background: "#0e0e10",
    surface: "#1c1c21",
    primary: "#00ff9f",
    secondary: "#00e0ff",
    accent: "#ff0080",
    text: "#f0f0f0",
  },
  "cloud-canvas": {
    mode: "light",
    background: "#fafafa",
    surface: "#ffffff",
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#dc2626",
    text: "#0f172a",
  },
  "pearl-minimal": {
    mode: "light",
    background: "#f8f9fa",
    surface: "#ffffff",
    primary: "#0066cc",
    secondary: "#6610f2",
    accent: "#ff6b35",
    text: "#212529",
  },
  "ivory-studio": {
    mode: "light",
    background: "#f5f5f4",
    surface: "#fafaf9",
    primary: "#0891b2",
    secondary: "#06b6d4",
    accent: "#f59e0b",
    text: "#1c1917",
  },
  "linen-soft": {
    mode: "light",
    background: "#fef7f0",
    surface: "#fffbf5",
    primary: "#d97706",
    secondary: "#ea580c",
    accent: "#0284c7",
    text: "#292524",
  },
  "porcelain-clean": {
    mode: "light",
    background: "#f9fafb",
    surface: "#ffffff",
    primary: "#4f46e5",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    text: "#111827",
  },
  "cream-elegance": {
    mode: "light",
    background: "#fefce8",
    surface: "#fefce8",
    primary: "#65a30d",
    secondary: "#84cc16",
    accent: "#f97316",
    text: "#365314",
  },
  "arctic-breeze": {
    mode: "light",
    background: "#f0f9ff",
    surface: "#f8fafc",
    primary: "#0284c7",
    secondary: "#0ea5e9",
    accent: "#f43f5e",
    text: "#0c4a6e",
  },
  "alabaster-pure": {
    mode: "light",
    background: "#fcfcfc",
    surface: "#ffffff",
    primary: "#1d4ed8",
    secondary: "#2563eb",
    accent: "#dc2626",
    text: "#1e293b",
  },
  "sand-warm": {
    mode: "light",
    background: "#faf8f5",
    surface: "#ffffff",
    primary: "#b45309",
    secondary: "#d97706",
    accent: "#059669",
    text: "#451a03",
  },
  "frost-bright": {
    mode: "light",
    background: "#f1f5f9",
    surface: "#f8fafc",
    primary: "#0f766e",
    secondary: "#14b8a6",
    accent: "#e11d48",
    text: "#0f172a",
  },
};

const sectionInnerSelectors = `
    .c-before-after__inner,
    .c-gallery__inner,
    .c-image-text__inner,
    .c-logo-strip__inner,
    .c-prose__inner,
    .c-feature-grid__inner,
    .c-faq__inner,
    .c-testimonials__inner
`;

const cardSelectors = `
    .c-before-after__item,
    .c-feature-grid__item,
    .c-faq__item,
    .c-logo-strip__link,
    .c-testimonials__item
`;

const framedMediaSelectors = `
    .c-before-after__image,
    .c-gallery__image,
    .c-image-text__image,
    .c-logo-strip__image,
    .c-media__image,
    .c-google-maps__frame,
    .c-testimonials__avatar
`;

const hexColorPattern = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

const expandHexColor = (hexColor: string): string => {
  if (hexColor.length === 4) {
    return `#${[...hexColor.slice(1)].map((channel) => `${channel}${channel}`).join("")}`;
  }

  return hexColor;
};

const parseHexColor = (
  hexColor: string,
): { red: number; green: number; blue: number } => {
  if (!hexColorPattern.test(hexColor)) {
    throw new Error(`Unsupported hex color: ${hexColor}`);
  }

  const normalizedHexColor = expandHexColor(hexColor);

  return {
    red: Number.parseInt(normalizedHexColor.slice(1, 3), 16),
    green: Number.parseInt(normalizedHexColor.slice(3, 5), 16),
    blue: Number.parseInt(normalizedHexColor.slice(5, 7), 16),
  };
};

const toHexColor = ({ red, green, blue }: { red: number; green: number; blue: number }): string =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const mixHexColors = (baseColor: string, targetColor: string, targetWeight: number): string => {
  const base = parseHexColor(baseColor);
  const target = parseHexColor(targetColor);
  const weight = Math.min(Math.max(targetWeight, 0), 1);

  return toHexColor({
    red: base.red + ((target.red - base.red) * weight),
    green: base.green + ((target.green - base.green) * weight),
    blue: base.blue + ((target.blue - base.blue) * weight),
  });
};

const toLinearChannel = (channel: number): number => {
  const normalizedChannel = channel / 255;

  if (normalizedChannel <= 0.03928) {
    return normalizedChannel / 12.92;
  }

  return ((normalizedChannel + 0.055) / 1.055) ** 2.4;
};

const getRelativeLuminance = (hexColor: string): number => {
  const { red, green, blue } = parseHexColor(hexColor);

  return (
    0.2126 * toLinearChannel(red) +
    0.7152 * toLinearChannel(green) +
    0.0722 * toLinearChannel(blue)
  );
};

const getContrastRatio = (firstLuminance: number, secondLuminance: number): number => {
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

const getReadablePrimaryContrast = (backgroundColor: string): string => {
  const backgroundLuminance = getRelativeLuminance(backgroundColor);
  const darkTextColor = "#111111";
  const darkTextContrast = getContrastRatio(
    backgroundLuminance,
    getRelativeLuminance(darkTextColor),
  );
  const lightTextContrast = getContrastRatio(backgroundLuminance, 1);

  return darkTextContrast >= lightTextContrast ? darkTextColor : "#ffffff";
};

const createSecondaryColorSchemeTokenOverrides = ({
  mode,
  background,
  surface,
  primary,
  secondary,
  accent,
  text,
}: SecondaryColorSchemePalette): Partial<ThemeTokens> => ({
  "--color-scheme": mode,
  "--color-bg": background,
  "--color-surface": surface,
  "--color-surface-alt": mixHexColors(surface, secondary, mode === "dark" ? 0.16 : 0.1),
  "--color-text": text,
  "--color-text-muted": mixHexColors(text, background, mode === "dark" ? 0.28 : 0.4),
  "--color-border": mixHexColors(surface, text, mode === "dark" ? 0.2 : 0.16),
  "--color-primary": primary,
  "--color-primary-contrast": getReadablePrimaryContrast(primary),
  "--color-accent": accent,
  "--color-link": secondary,
  "--color-link-hover": accent,
  "--color-focus-ring": secondary,
  "--page-background": background,
  "--surface-background": surface,
  "--hero-background": mixHexColors(surface, background, mode === "dark" ? 0.35 : 0.2),
  "--cta-background": mixHexColors(surface, accent, mode === "dark" ? 0.12 : 0.08),
  "--button-secondary-text": text,
});

const secondaryColorSchemeTokenOverrides: Record<
  SecondaryColorSchemeName,
  Partial<ThemeTokens>
> = Object.fromEntries(
  Object.entries(secondaryColorSchemePalettes).map(([schemeName, palette]) => [
    schemeName,
    createSecondaryColorSchemeTokenOverrides(palette),
  ]),
) as Record<SecondaryColorSchemeName, Partial<ThemeTokens>>;

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
  divider: `
    ${sectionInnerSelectors} {
      padding-block-start: var(--space-5);
      border-block-start: var(--border-width-1) solid var(--color-border);
    }

    .c-hero__body,
    ${cardSelectors},
    .c-cta-band__inner {
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .c-hero__body,
    .c-cta-band__inner {
      border-width: var(--border-width-1) 0;
    }

    ${cardSelectors} {
      border-width: 0 0 var(--border-width-1) 0;
    }

    ${framedMediaSelectors} {
      box-shadow: none;
    }
  `,
  fill: `
    ${sectionInnerSelectors} {
      padding: var(--space-5);
      border-radius: var(--radius-lg);
      background: var(--color-surface-alt);
    }

    .c-hero__body,
    ${cardSelectors},
    .c-cta-band__inner {
      border-color: transparent;
      background: var(--color-surface-alt);
      box-shadow: none;
    }

    ${framedMediaSelectors} {
      box-shadow: none;
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
      ...overrides?.cssVariables,
    },
    css: css || undefined,
  };
};
