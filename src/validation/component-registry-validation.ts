import { existsSync } from "node:fs";

import type { ComponentDefinition, ComponentType } from "../components/index.js";
import type { ValidationIssue } from "./site-validation.js";

export const validateComponentRegistry = (
  componentDefinitions: readonly ComponentDefinition[],
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const seenTypes = new Set<ComponentType>();

  componentDefinitions.forEach((componentDefinition) => {
    if (seenTypes.has(componentDefinition.type)) {
      issues.push({
        path: [],
        source: "component-registry",
        message: `duplicate component type '${componentDefinition.type}'`,
      });
    } else {
      seenTypes.add(componentDefinition.type);
    }

    if (!componentDefinition.classNames.length) {
      issues.push({
        path: [],
        source: "component-registry",
        message: `component '${componentDefinition.type}' has no declared class contract`,
      });
    }

    if (!existsSync(componentDefinition.cssPath)) {
      issues.push({
        path: [],
        source: "component-registry",
        message: `component '${componentDefinition.type}' is missing CSS at ${componentDefinition.cssPath}`,
      });
    }
  });

  return issues;
};
