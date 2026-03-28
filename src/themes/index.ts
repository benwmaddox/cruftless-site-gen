import type { ThemeDefinition } from "./tokens.js";
import { appAnnouncementTheme } from "./app-announcement.js";
import { brutalismTheme } from "./brutalism.js";
import { corporateTheme } from "./corporate.js";
import { darkSaasTheme } from "./dark-saas.js";

export const themeNames = [
  "brutalism",
  "dark-saas",
  "corporate",
  "app-announcement",
] as const;

export type ThemeName = (typeof themeNames)[number];

export const themes: Record<ThemeName, ThemeDefinition> = {
  brutalism: brutalismTheme,
  "dark-saas": darkSaasTheme,
  corporate: corporateTheme,
  "app-announcement": appAnnouncementTheme,
};

