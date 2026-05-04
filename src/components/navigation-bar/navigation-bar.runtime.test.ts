import { describe, expect, it } from "vitest";

import {
  navigationBarRuntimeScript,
  resolveNavigationBarMode,
} from "./navigation-bar.runtime.js";

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Array<() => void>>();
  readonly selectors = new Map<string, FakeElement | FakeElement[]>();
  clientWidth = 0;
  scrollWidth = 0;
  hidden = false;
  rectWidth = 0;

  querySelector(selector: string): FakeElement | null {
    const value = this.selectors.get(selector);
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const value = this.selectors.get(selector);
    if (Array.isArray(value)) {
      return value;
    }

    return value ? [value] : [];
  }

  addEventListener(eventName: string, listener: () => void): void {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
  }

  dispatchEvent(eventName: string): void {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener();
    }
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | undefined {
    return this.attributes.get(name);
  }

  getBoundingClientRect(): { width: number } {
    return { width: this.rectWidth };
  }
}

class FakeButtonElement extends FakeElement {}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  readonly observedElements: FakeElement[] = [];

  constructor(readonly callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }

  observe(element: FakeElement): void {
    this.observedElements.push(element);
  }

  trigger(): void {
    this.callback();
  }
}

class FakeDocument {
  readonly listeners = new Map<string, Array<() => void>>();

  constructor(
    readonly navbars: FakeElement[],
    public readyState: "loading" | "complete" = "complete",
  ) {}

  querySelectorAll(selector: string): FakeElement[] {
    if (selector === ".c-navbar[data-js='navigation-bar']") {
      return this.navbars;
    }

    return [];
  }

  addEventListener(eventName: string, listener: () => void): void {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
  }

  dispatchEvent(eventName: string): void {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener();
    }
  }
}

class FakeWindow {
  readonly listeners = new Map<string, Array<() => void>>();
  matchesNarrowViewport = false;

  getComputedStyle(): { columnGap: string; gap: string } {
    return {
      columnGap: "24",
      gap: "24",
    };
  }

  addEventListener(eventName: string, listener: () => void): void {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
  }

  matchMedia(query: string): { matches: boolean; media: string } {
    return {
      matches: query === "(max-width: 40rem)" && this.matchesNarrowViewport,
      media: query,
    };
  }
}

const createNavigationBarFixture = (): {
  brand: FakeElement;
  button: FakeButtonElement;
  document: FakeDocument;
  navbar: FakeElement;
  panel: FakeElement;
  row: FakeElement;
  window: FakeWindow;
} => {
  const navbar = new FakeElement();
  const row = new FakeElement();
  const brand = new FakeElement();
  const measure = new FakeElement();
  const button = new FakeButtonElement();
  const panel = new FakeElement();
  const links = [new FakeElement(), new FakeElement()];
  const document = new FakeDocument([navbar], "loading");
  const window = new FakeWindow();

  navbar.dataset.navigationBarMode = "inline";
  navbar.dataset.navigationBarOpen = "false";
  row.clientWidth = 320;
  brand.rectWidth = 180;
  measure.scrollWidth = 280;
  panel.hidden = true;

  navbar.selectors.set(".c-navbar__inner", row);
  navbar.selectors.set(".c-navbar__brand", brand);
  navbar.selectors.set(".c-navbar__measure", measure);
  navbar.selectors.set(".c-navbar__menu-button", button);
  navbar.selectors.set(".c-navbar__panel", panel);
  panel.selectors.set("a", links);

  return {
    brand,
    button,
    document,
    navbar,
    panel,
    row,
    window,
  };
};

describe("resolveNavigationBarMode", () => {
  it("stays inline when the branding and link list fit inside the available width", () => {
    expect(
      resolveNavigationBarMode({
        containerWidth: 640,
        brandingWidth: 180,
        navWidth: 420,
        gap: 24,
      }),
    ).toBe("inline");
  });

  it("collapses when the combined content would overflow the row", () => {
    expect(
      resolveNavigationBarMode({
        containerWidth: 620,
        brandingWidth: 210,
        navWidth: 420,
        gap: 24,
      }),
    ).toBe("collapsed");
  });

  it("ignores the gap when only the nav links are present", () => {
    expect(
      resolveNavigationBarMode({
        containerWidth: 340,
        brandingWidth: 0,
        navWidth: 300,
        gap: 24,
      }),
    ).toBe("inline");
  });

  it("emits a browser-safe bootstrap script that wires the navigation runtime", () => {
    expect(navigationBarRuntimeScript).toContain("const resolveNavigationBarMode =");
    expect(navigationBarRuntimeScript).toContain("setupNavigationBars");
    expect(navigationBarRuntimeScript).toContain("DOMContentLoaded");
    expect(navigationBarRuntimeScript).toContain("ResizeObserver");
    expect(navigationBarRuntimeScript).not.toContain("__name");
  });

  it("boots into collapsed mode on a small initial load and reopens inline after resize", () => {
    FakeResizeObserver.instances = [];

    const { button, document, navbar, panel, row, window } = createNavigationBarFixture();
    const runNavigationRuntime = new Function(
      "document",
      "window",
      "ResizeObserver",
      "HTMLElement",
      "HTMLButtonElement",
      navigationBarRuntimeScript,
    );

    runNavigationRuntime(
      document,
      window,
      FakeResizeObserver,
      FakeElement,
      FakeButtonElement,
    );

    expect(navbar.dataset.navigationBarMode).toBe("inline");

    document.readyState = "complete";
    document.dispatchEvent("DOMContentLoaded");

    expect(navbar.dataset.navigationBarMode).toBe("collapsed");
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");

    button.dispatchEvent("click");

    expect(navbar.dataset.navigationBarOpen).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    row.clientWidth = 560;
    FakeResizeObserver.instances[0]?.trigger();

    expect(navbar.dataset.navigationBarMode).toBe("inline");
    expect(navbar.dataset.navigationBarOpen).toBe("false");
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the menu when the CSS narrow-viewport breakpoint forces the button visible", () => {
    FakeResizeObserver.instances = [];

    const { button, document, navbar, panel, row, window } = createNavigationBarFixture();
    const runNavigationRuntime = new Function(
      "document",
      "window",
      "ResizeObserver",
      "HTMLElement",
      "HTMLButtonElement",
      navigationBarRuntimeScript,
    );

    row.clientWidth = 760;
    window.matchesNarrowViewport = true;

    runNavigationRuntime(
      document,
      window,
      FakeResizeObserver,
      FakeElement,
      FakeButtonElement,
    );

    document.readyState = "complete";
    document.dispatchEvent("DOMContentLoaded");

    expect(navbar.dataset.navigationBarMode).toBe("collapsed");
    expect(panel.hidden).toBe(true);

    button.dispatchEvent("click");

    expect(navbar.dataset.navigationBarOpen).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
});
