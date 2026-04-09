import {
  countPageContentSlots,
  resolvePageComponentEntries,
} from "../layout/page-layout.js";
import type { SiteContentData } from "../schemas/site.schema.js";

export interface ValidationIssue {
  path: Array<string | number>;
  message: string;
  componentType?: string;
  source?: string;
}

export const collectSiteValidationIssues = (
  siteContent: SiteContentData,
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const slugIndexMap = new Map<string, number>();
  const layoutComponents = siteContent.site.layout?.components;
  const hasValidLayoutSlotCount =
    !layoutComponents || countPageContentSlots(layoutComponents) === 1;

  if (layoutComponents) {
    if (!hasValidLayoutSlotCount) {
      issues.push({
        path: ["site", "layout", "components"],
        message: "site layout must include exactly one 'page-content' slot",
      });
    }
  }

  const collectNestedComponentEntries = (
    component: SiteContentData["pages"][number]["components"][number],
    path: Array<string | number>,
  ): Array<{
    component: SiteContentData["pages"][number]["components"][number];
    path: Array<string | number>;
  }> => {
    const entries = [{ component, path }];

    if (component.type === "horizontal-split") {
      entries.push(
        ...collectNestedComponentEntries(component.first, [...path, "first"]),
        ...collectNestedComponentEntries(component.second, [...path, "second"]),
      );
    }

    return entries;
  };

  siteContent.pages.forEach((page, pageIndex) => {
    const existingPageIndex = slugIndexMap.get(page.slug);

    if (typeof existingPageIndex === "number") {
      issues.push({
        path: ["pages", pageIndex, "slug"],
        message: `duplicate slug '${page.slug}' also used by pages[${existingPageIndex}]`,
      });
    } else {
      slugIndexMap.set(page.slug, pageIndex);
    }

    let heroCount = 0;
    const resolvedEntries = (
      hasValidLayoutSlotCount
        ? resolvePageComponentEntries(siteContent.site, page, pageIndex)
        : page.components.map((component, componentIndex) => ({
            component,
            path: ["pages", pageIndex, "components", componentIndex],
          }))
    ).flatMap((entry) => collectNestedComponentEntries(entry.component, entry.path));

    resolvedEntries.forEach((entry) => {
      const { component } = entry;

      if (component.type !== "hero") {
        return;
      }

      heroCount += 1;
      if (heroCount > 1) {
        issues.push({
          path: entry.path,
          componentType: "hero",
          message: "only one hero is allowed per page",
        });
      }
    });
  });

  return issues;
};
