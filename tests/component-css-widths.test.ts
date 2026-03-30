import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

const readComponentCss = async (componentName: string) =>
  readFile(path.join(repoRoot, "src", "components", componentName, `${componentName}.css`), "utf8");

describe("component width tokens", () => {
  it("uses content-max for standard component wrappers", async () => {
    const standardComponents = [
      "cta-band",
      "faq",
      "feature-grid",
      "feature-list",
      "hero",
      "prose",
    ];

    const cssFiles = await Promise.all(standardComponents.map(readComponentCss));

    for (const css of cssFiles) {
      expect(css).toContain("var(--content-max)");
      expect(css).not.toContain("var(--container-max)");
    }
  });

  it("keeps media width modes split between content and container tokens", async () => {
    const css = await readComponentCss("media");

    expect(css).toContain(".c-media--size-content");
    expect(css).toContain("var(--content-max)");
    expect(css).toContain(".c-media--size-wide");
    expect(css).toContain("var(--container-max)");
  });
});
