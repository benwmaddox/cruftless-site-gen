import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { componentDefinitions } from "../src/components/index.js";
import { defaultThemeTokens } from "../src/themes/tokens.js";

const readBaseCss = async () => readFile(path.resolve(process.cwd(), "src/styles/base.css"), "utf8");

describe("component width tokens", () => {
  it("keeps max-width at 80rem by default", () => {
    expect(defaultThemeTokens["--max-width"]).toBe("80rem");
  });

  it("uses max-width for standard component wrappers via container class", async () => {
    const baseCss = await readBaseCss();
    expect(baseCss).toContain(".l-section {");
    expect(baseCss).toContain("max-width: var(--max-width);");
    expect(baseCss).not.toContain("var(--container-max)");
    expect(baseCss).not.toContain("var(--content-max)");
  });

  it("supports explicit feature grid column counts before wrapping", async () => {
    const css = await readFile(
      componentDefinitions.find((component) => component.type === "feature-grid")!.cssPath,
      "utf8",
    );

    expect(css).toContain(".c-feature-grid__items--cols-1 {");
    expect(css).toContain(".c-feature-grid__items--cols-2 {");
    expect(css).toContain(".c-feature-grid__items--cols-3 {");
    expect(css).toContain(".c-feature-grid__items--cols-4 {");
  });

  it("uses standard width for media items", async () => {
    const css = await readFile(
      componentDefinitions.find((component) => component.type === "media")!.cssPath,
      "utf8",
    );

    expect(css).toContain(".c-media {");
    // max-width is supplied by the shared .l-container class in base.css
  });

  it("uses a dedicated readable text color for secondary buttons", async () => {
    const css = await readBaseCss();

    expect(css).toContain("color: var(--text);");
  });

  it("keeps primary button text readable on hover", async () => {
    const css = await readBaseCss();

    expect(css).toContain(".c-button--primary:hover {");
    expect(css).toContain("background: var(--link-hover);");
  });

  it("uses mobile-safe viewport units for short-page layouts", async () => {
    const css = await readBaseCss();

    expect(css).toContain("min-height: 100dvh;");
    expect(css).toContain(".l-page {");
  });

  it("enables default interpolated transitions for site elements", async () => {
    const css = await readBaseCss();

    expect(defaultThemeTokens["--duration"]).toBe("0.5s");
    expect(css).toContain("@supports (interpolate-size: allow-keywords) {");
    expect(css).toContain("interpolate-size: allow-keywords;");
    expect(css).toContain("transition-property: all;");
    expect(css).toContain("transition-duration: var(--duration);");
    expect(css).toContain("transition-behavior: allow-discrete;");
  });

  it("allows navigation menu display and auto-height transitions", async () => {
    const css = await readFile(
      componentDefinitions.find((component) => component.type === "navigation-bar")!.cssPath,
      "utf8",
    );

    expect(css).toContain("transition-property: opacity, transform, height, display;");
    expect(css).toContain("transition-behavior: allow-discrete;");
    expect(css).toContain("@supports (interpolate-size: allow-keywords) {");
    expect(css).toContain("height: auto;");
    expect(css).toContain("@starting-style");
  });

  it("keeps google maps width modes split between content and container tokens", async () => {
    const css = await readFile(
      componentDefinitions.find((component) => component.type === "google-maps")!.cssPath,
      "utf8",
    );

    expect(css).toContain(".c-google-maps--size-content");
    expect(css).toContain(".c-google-maps--size-wide");
  });
});
