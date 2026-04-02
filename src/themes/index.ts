import type { ThemeDefinition } from "./tokens.js";
import { brutalismTheme } from "./brutalism.js";
import { corporateTheme } from "./corporate.js";
import { friendlyModernTheme } from "./friendly-modern.js";
import { heritageLocalTheme } from "./heritage-local.js";
import { highVisServiceTheme } from "./high-vis-service.js";
import { refinedProfessionalTheme } from "./refined-professional.js";
import { wellnessCalmTheme } from "./wellness-calm.js";
import { workshopTheme } from "./workshop.js";

export const themeNames = [
  "corporate",
  "brutalism",
  "workshop",
  "refined-professional",
  "friendly-modern",
  "heritage-local",
  "wellness-calm",
  "high-vis-service",
] as const;

export type ThemeName = (typeof themeNames)[number];

export const themes: Record<ThemeName, ThemeDefinition> = {
  corporate: corporateTheme,
  brutalism: brutalismTheme,
  workshop: workshopTheme,
  "refined-professional": refinedProfessionalTheme,
  "friendly-modern": friendlyModernTheme,
  "heritage-local": heritageLocalTheme,
  "wellness-calm": wellnessCalmTheme,
  "high-vis-service": highVisServiceTheme,
};
