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

const hasModernLayoutComponents = (site: SiteData): boolean =>
  Boolean(
    site.layout &&
      ((site.layout.headerComponents?.length ?? 0) > 0 ||
        (site.layout.footerComponents?.length ?? 0) > 0 ||
        !site.layout.components),
  );

export const hasMixedLayoutComponentModels = (site: SiteData): boolean =>
  Boolean(
    site.layout?.components &&
      ((site.layout.headerComponents?.length ?? 0) > 0 ||
        (site.layout.footerComponents?.length ?? 0) > 0),
  );

export const splitLegacyLayoutComponents = (
  components: readonly SiteLayoutComponentData[],
): { footerComponents: ComponentData[]; headerComponents: ComponentData[] } => {
  const slotIndex = components.findIndex((component) => isPageContentSlot(component));

  if (slotIndex < 0) {
    return {
      headerComponents: [],
      footerComponents: [],
    };
  }

  return {
    headerComponents: components
      .slice(0, slotIndex)
      .filter((component): component is ComponentData => !isPageContentSlot(component)),
    footerComponents: components
      .slice(slotIndex + 1)
      .filter((component): component is ComponentData => !isPageContentSlot(component)),
  };
};

export const resolveSiteLayoutComponents = (
  site: SiteData,
): { footerComponents: readonly ComponentData[]; headerComponents: readonly ComponentData[] } => {
  if (!site.layout) {
    return {
      headerComponents: [],
      footerComponents: [],
    };
  }

  if (hasModernLayoutComponents(site) || hasMixedLayoutComponentModels(site)) {
    return {
      headerComponents: site.layout.headerComponents ?? [],
      footerComponents: site.layout.footerComponents ?? [],
    };
  }

  return splitLegacyLayoutComponents(site.layout.components ?? []);
};

export const resolvePageComponentEntries = (
  site: SiteData,
  page: PageData,
  pageIndex: number,
): ResolvedPageComponentEntry[] => {
  const layoutComponents = resolveSiteLayoutComponents(site);

  if (layoutComponents.headerComponents.length === 0 && layoutComponents.footerComponents.length === 0) {
    return page.components.map((component, componentIndex) => ({
      component,
      path: ["pages", pageIndex, "components", componentIndex],
    }));
  }

  return [
    ...layoutComponents.headerComponents.map((component, componentIndex) => ({
      component,
      path: ["site", "layout", "headerComponents", componentIndex],
    })),
    ...page.components.map((component, componentIndex) => ({
      component,
      path: ["pages", pageIndex, "components", componentIndex],
    })),
    ...layoutComponents.footerComponents.map((component, componentIndex) => ({
      component,
      path: ["site", "layout", "footerComponents", componentIndex],
    })),
  ];
};

export const resolvePageComponents = (
  site: SiteData,
  page: PageData,
  pageIndex: number,
): ComponentData[] =>
  resolvePageComponentEntries(site, page, pageIndex).map((entry) => entry.component);
