import type { ThemeDefinition } from "./tokens.js";

export const emitThemeCss = (theme: ThemeDefinition): string => {
  const declarations = Object.entries(theme.tokens)
    .map(([tokenName, tokenValue]) => `  ${tokenName}: ${tokenValue};`)
    .join("\n");

  return [`:root {\n${declarations}\n}`, theme.css?.trim()].filter(Boolean).join("\n\n") + "\n";
};
