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
    page.components.forEach((component, componentIndex) => {
      if (component.type !== "hero") {
        return;
      }

      heroCount += 1;
      if (heroCount > 1) {
        issues.push({
          path: ["pages", pageIndex, "components", componentIndex],
          componentType: "hero",
          message: "only one hero is allowed per page",
        });
      }
    });
  });

  return issues;
};

