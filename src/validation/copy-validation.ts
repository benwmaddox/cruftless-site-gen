import type { SiteContentData } from "../schemas/site.schema.js";
import type { ValidationIssue } from "./site-validation.js";

interface CopyLintRule {
  pattern: RegExp;
  message: string;
}

const publicFacingCopyMessage = (detail: string): string =>
  `copy must be public-facing publish-ready content, not ${detail}`;

const bannedCopyRules: readonly CopyLintRule[] = [
  {
    pattern: /\bwhat the live site\b/i,
    message: publicFacingCopyMessage("meta wording about the live site"),
  },
  {
    pattern: /\bsource site\b/i,
    message: publicFacingCopyMessage("meta wording about the source site"),
  },
  {
    pattern: /\blive site\b/i,
    message: publicFacingCopyMessage("meta wording about the live site"),
  },
  {
    pattern: /\bwhat this demo\b/i,
    message: publicFacingCopyMessage("meta wording about the demo"),
  },
  {
    pattern: /\bthis demo\b/i,
    message: publicFacingCopyMessage("meta wording about the demo"),
  },
  {
    pattern: /\bpreserved from\b/i,
    message: publicFacingCopyMessage("migration commentary"),
  },
  {
    pattern: /\bthe redesign\b/i,
    message: publicFacingCopyMessage("meta wording about the redesign"),
  },
  {
    pattern: /\bthe rebuild\b/i,
    message: publicFacingCopyMessage("meta wording about the rebuild"),
  },
];

const normalizeCopy = (value: string): string => value.replaceAll(/\s+/g, " ").trim();

const collectStringCopyIssues = (
  value: string,
  path: Array<string | number>,
): ValidationIssue[] => {
  const normalizedValue = normalizeCopy(value);

  const matchedRule = bannedCopyRules.find((rule) => rule.pattern.test(normalizedValue));
  if (!matchedRule) {
    return [];
  }

  return [
    {
      path,
      message: matchedRule.message,
    },
  ];
};

const collectNestedCopyIssues = (
  value: unknown,
  path: Array<string | number>,
): ValidationIssue[] => {
  if (typeof value === "string") {
    return collectStringCopyIssues(value, path);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectNestedCopyIssues(entry, [...path, index]));
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, entryValue]) =>
      collectNestedCopyIssues(entryValue, [...path, key]),
    );
  }

  return [];
};

export const collectCopyValidationIssues = (
  siteContent: SiteContentData,
): ValidationIssue[] => collectNestedCopyIssues(siteContent, []);
