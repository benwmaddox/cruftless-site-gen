import { readFile } from "node:fs/promises";

import type { ThemeDefinition, ThemeTokenName } from "../themes/tokens.js";
import { assertExactThemeTokens, themeTokenSet } from "../themes/tokens.js";
import type { ValidationIssue } from "./site-validation.js";

const CSS_VAR_PATTERN = /var\((--[a-z0-9-]+)/gi;
const DECLARATION_PATTERN = /^\s*([a-z-]+|--[a-z0-9-]+)\s*:\s*(.*)$/i;
const DISALLOWED_CSS_PROPERTIES = new Set([
  "float",
  "clear",
  "columns",
  "column-count",
  "column-gap",
  "column-rule",
  "column-span",
  "column-width",
  "margin-left",
  "margin-right",
  "padding-left",
  "padding-right",
]);
const VENDOR_PREFIX_PATTERN = /-(webkit|moz|ms|o)-[a-z0-9-]+/i;

type CssPolicyViolation = {
  lineNumber: number;
  message: string;
};

type CssDeclaration = {
  lineNumber: number;
  propertyName: string;
  value: string;
};

const collectCssDeclarations = (css: string): CssDeclaration[] => {
  const declarations: CssDeclaration[] = [];
  const lines = css.replace(/\/\*[\s\S]*?\*\//g, "").split(/\r?\n/);

  let braceDepth = 0;
  let currentDeclaration:
    | {
        lineNumber: number;
        propertyName: string;
        valueLines: string[];
      }
    | undefined;

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;

    if (currentDeclaration) {
      currentDeclaration.valueLines.push(line.trim());
      if (line.includes(";")) {
        declarations.push({
          lineNumber: currentDeclaration.lineNumber,
          propertyName: currentDeclaration.propertyName,
          value: currentDeclaration.valueLines.join(" ").replace(/;\s*$/, "").trim(),
        });
        currentDeclaration = undefined;
      }
    } else if (braceDepth > 0) {
      const declarationMatch = line.match(DECLARATION_PATTERN);

      if (declarationMatch) {
        currentDeclaration = {
          lineNumber,
          propertyName: declarationMatch[1].toLowerCase(),
          valueLines: [declarationMatch[2].trim()],
        };

        if (line.includes(";")) {
          declarations.push({
            lineNumber: currentDeclaration.lineNumber,
            propertyName: currentDeclaration.propertyName,
            value: currentDeclaration.valueLines.join(" ").replace(/;\s*$/, "").trim(),
          });
          currentDeclaration = undefined;
        }
      }
    }

    braceDepth += (line.match(/{/g) ?? []).length;
    braceDepth -= (line.match(/}/g) ?? []).length;
  }

  return declarations;
};

export const findCruftlessCssPolicyViolations = (css: string): CssPolicyViolation[] => {
  const violations: CssPolicyViolation[] = [];

  for (const declaration of collectCssDeclarations(css)) {
    if (DISALLOWED_CSS_PROPERTIES.has(declaration.propertyName)) {
      violations.push({
        lineNumber: declaration.lineNumber,
        message: `disallowed CSS property '${declaration.propertyName}' from cruftless policy`,
      });
    }

    if (
      declaration.propertyName.startsWith("-") &&
      !declaration.propertyName.startsWith("--") &&
      VENDOR_PREFIX_PATTERN.test(declaration.propertyName)
    ) {
      violations.push({
        lineNumber: declaration.lineNumber,
        message: `vendor-prefixed property '${declaration.propertyName}' is not allowed`,
      });
    }

    const vendorPrefixedValueMatch = declaration.value.match(VENDOR_PREFIX_PATTERN);
    if (vendorPrefixedValueMatch) {
      violations.push({
        lineNumber: declaration.lineNumber,
        message: `vendor-prefixed value '${vendorPrefixedValueMatch[0]}' is not allowed`,
      });
    }
  }

  return violations;
};

export const findUnknownCssVarTokens = (css: string): string[] => {
  const foundTokens = new Set<string>();

  for (const match of css.matchAll(CSS_VAR_PATTERN)) {
    foundTokens.add(match[1]);
  }

  return [...foundTokens].filter(
    (tokenName) => !themeTokenSet.has(tokenName as ThemeTokenName),
  );
};

export const validateThemeDefinition = (
  themeName: string,
  theme: ThemeDefinition,
): ValidationIssue[] => {
  try {
    assertExactThemeTokens(theme);
    return [];
  } catch (error) {
    return [
      {
        path: [],
        source: `theme:${themeName}`,
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
};

export const validateCssTokenUsage = async (
  cssPaths: readonly string[],
): Promise<ValidationIssue[]> => {
  const issues: ValidationIssue[] = [];

  for (const cssPath of cssPaths) {
    const css = await readFile(cssPath, "utf8");
    const unknownTokens = findUnknownCssVarTokens(css);
    const policyViolations = findCruftlessCssPolicyViolations(css);

    if (unknownTokens.length > 0) {
      issues.push({
        path: [],
        source: cssPath,
        message: `unknown theme token reference(s): ${unknownTokens.join(", ")}`,
      });
    }

    for (const violation of policyViolations) {
      issues.push({
        path: [],
        source: `${cssPath}:${violation.lineNumber}`,
        message: violation.message,
      });
    }
  }

  return issues;
};
