import { describe, expect, it } from "vitest";

import {
  navigationBarRuntimeScript,
  resolveNavigationBarMode,
} from "./navigation-bar.runtime.js";

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

  it("emits a bootstrap script that wires the navigation runtime", () => {
    expect(navigationBarRuntimeScript).toContain("const resolveNavigationBarMode =");
    expect(navigationBarRuntimeScript).toContain("setupNavigationBars");
    expect(navigationBarRuntimeScript).toContain("DOMContentLoaded");
  });
});
