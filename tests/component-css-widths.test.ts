import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

const readComponentCss = async (componentName: string) =>
  readFile(path.join(repoRoot, "src", "components", componentName, `${componentName}.css`), "utf8");
const readBaseCss = async () => readFile(path.join(repoRoot, "src", "styles", "base.css"), "utf8");

describe("component width tokens", () => {
  it("uses content-max for standard component wrappers", async () => {
    const standardComponents = [
      "contact-form",
      "cta-band",
      "faq",
      "feature-grid",
      "feature-list",
      "hero",
      "navigation-bar",
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
    expect(css).toContain("width: auto;");
    expect(css).toContain("max-width: 100%;");
    expect(css).toContain("margin-inline: auto;");
  });

  it("uses a dedicated readable text color for secondary buttons", async () => {
    const css = await readBaseCss();

    expect(css).toContain("color: var(--button-secondary-text);");
  });

  it("keeps primary button text readable on hover", async () => {
    const css = await readBaseCss();

    expect(css).toContain(".c-button--primary:hover {");
    expect(css).toContain("color: var(--color-primary-contrast);");
  });

  it("uses mobile-safe viewport units for short-page layouts", async () => {
    const css = await readBaseCss();

    expect(css).toContain("min-height: 100svh;");
    expect(css).toContain("min-height: 100dvh;");
    expect(css).toContain(".l-page {");
    expect(css).toContain("min-height: inherit;");
  });

  it("keeps google maps width modes split between content and container tokens", async () => {
    const css = await readComponentCss("google-maps");

    expect(css).toContain(".c-google-maps--size-content");
    expect(css).toContain("var(--content-max)");
    expect(css).toContain(".c-google-maps--size-wide");
    expect(css).toContain("var(--container-max)");
  });
});
