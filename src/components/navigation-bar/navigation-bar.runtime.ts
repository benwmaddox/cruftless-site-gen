export type NavigationBarMode = "inline" | "collapsed";

declare const document: any;
declare const window: any;
declare const ResizeObserver: any;
declare const HTMLElement: any;
declare const HTMLButtonElement: any;

export interface ResolveNavigationBarModeInput {
  containerWidth: number;
  brandingWidth: number;
  navWidth: number;
  gap: number;
}

export const resolveNavigationBarMode = ({
  containerWidth,
  brandingWidth,
  navWidth,
  gap,
}: ResolveNavigationBarModeInput): NavigationBarMode => {
  const normalizeWidth = (value: number): number =>
    Number.isFinite(value) && value > 0 ? value : 0;
  const safeContainerWidth = normalizeWidth(containerWidth);
  const safeBrandingWidth = normalizeWidth(brandingWidth);
  const safeNavWidth = normalizeWidth(navWidth);
  const safeGap = safeBrandingWidth > 0 && safeNavWidth > 0 ? normalizeWidth(gap) : 0;
  const requiredWidth = safeBrandingWidth + safeNavWidth + safeGap;

  return requiredWidth <= safeContainerWidth + 1 ? "inline" : "collapsed";
};

const setupNavigationBars = () => {
  const navbars = document.querySelectorAll(".c-navbar[data-js='navigation-bar']");

  navbars.forEach((navbar: any) => {
    if (!(navbar instanceof HTMLElement)) {
      return;
    }

    const row = navbar.querySelector(".c-navbar__inner");
    const brand = navbar.querySelector(".c-navbar__brand");
    const measure = navbar.querySelector(".c-navbar__measure");
    const button = navbar.querySelector(".c-navbar__menu-button");
    const panel = navbar.querySelector(".c-navbar__panel");

    if (
      !(row instanceof HTMLElement) ||
      !(measure instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement) ||
      !(panel instanceof HTMLElement)
    ) {
      return;
    }

    const closePanel = () => {
      navbar.dataset.navigationBarOpen = "false";
      button.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    };

    const openPanel = () => {
      navbar.dataset.navigationBarOpen = "true";
      button.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    };

    const syncMode = () => {
      const styles = window.getComputedStyle(row);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
      const brandingWidth = brand instanceof HTMLElement ? brand.getBoundingClientRect().width : 0;
      const navWidth = measure.scrollWidth;
      const mode = resolveNavigationBarMode({
        containerWidth: row.clientWidth,
        brandingWidth,
        navWidth,
        gap,
      });

      navbar.dataset.navigationBarMode = mode;

      if (mode === "inline") {
        closePanel();
        return;
      }

      panel.hidden = navbar.dataset.navigationBarOpen !== "true";
    };

    closePanel();

    button.addEventListener("click", () => {
      if (navbar.dataset.navigationBarMode !== "collapsed") {
        return;
      }

      if (navbar.dataset.navigationBarOpen === "true") {
        closePanel();
      } else {
        openPanel();
      }
    });

    panel.querySelectorAll("a").forEach((link: any) => {
      link.addEventListener("click", closePanel);
    });

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(syncMode);
      observer.observe(row);
      observer.observe(measure);

      if (brand instanceof HTMLElement) {
        observer.observe(brand);
      }
    } else {
      window.addEventListener("resize", syncMode);
    }

    syncMode();
  });
};

const bootstrapNavigationBars = () => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupNavigationBars, { once: true });
    return;
  }

  setupNavigationBars();
};

export const navigationBarRuntimeScript = [
  `const resolveNavigationBarMode = ${resolveNavigationBarMode.toString()};`,
  `const setupNavigationBars = ${setupNavigationBars.toString()};`,
  `(${bootstrapNavigationBars.toString()})();`,
].join("\n\n");
