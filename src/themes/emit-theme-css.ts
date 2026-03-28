import type { ThemeDefinition } from "./tokens.js";

export const emitThemeCss = (theme: ThemeDefinition): string => {
  const declarations = Object.entries(theme)
    .map(([tokenName, tokenValue]) => `  ${tokenName}: ${tokenValue};`)
    .join("\n");

  return `:root {\n${declarations}\n}\n`;
};

