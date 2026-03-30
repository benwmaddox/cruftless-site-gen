import type { ComponentData } from "../components/index.js";
import type {
  PageData,
  SiteData,
  SiteLayoutComponentData,
} from "../schemas/site.schema.js";

export interface ResolvedPageComponentEntry {
  component: ComponentData;
  path: Array<string | number>;
}

export const isPageContentSlot = (
  component: SiteLayoutComponentData,
): component is Extract<SiteLayoutComponentData, { type: "page-content" }> =>
  component.type === "page-content";

export const countPageContentSlots = (
  components: readonly SiteLayoutComponentData[],
): number => components.filter((component) => isPageContentSlot(component)).length;

export const resolvePageComponentEntries = (
  site: SiteData,
  page: PageData,
  pageIndex: number,
): ResolvedPageComponentEntry[] => {
  const layoutComponents = site.layout?.components;

  if (!layoutComponents) {
    return page.components.map((component, componentIndex) => ({
      component,
      path: ["pages", pageIndex, "components", componentIndex],
    }));
  }

  return layoutComponents.flatMap((component, layoutIndex) =>
    isPageContentSlot(component)
      ? page.components.map((pageComponent, componentIndex) => ({
          component: pageComponent,
          path: ["pages", pageIndex, "components", componentIndex],
        }))
      : [
          {
            component,
            path: ["site", "layout", "components", layoutIndex],
          },
        ],
  );
};

export const resolvePageComponents = (
  site: SiteData,
  page: PageData,
  pageIndex: number,
): ComponentData[] =>
  resolvePageComponentEntries(site, page, pageIndex).map((entry) => entry.component);
