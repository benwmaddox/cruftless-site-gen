import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// @ts-ignore Vitest imports the ESM helper directly for behavior tests.
import * as validateDistLinks from "../scripts/validate-dist-links.mjs";

const { extractReferencesFromFile, findBrokenDistReferences, isSameSiteRelativeReference } =
  validateDistLinks;

const tempDirectories: string[] = [];

const createTempDist = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cruftless-dist-links-"));
  tempDirectories.push(directory);
  return directory;
};

const writeFixture = (rootDir: string, relativePath: string, contents: string) => {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
};

describe("dist link validation", () => {
  afterEach(() => {
    while (tempDirectories.length > 0) {
      const directory = tempDirectories.pop();

      if (directory) {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    }
  });

  it("treats same-site root-relative and relative references as in-scope", () => {
    expect(isSameSiteRelativeReference("/pricing")).toBe(true);
    expect(isSameSiteRelativeReference("../assets/site.css?v=1")).toBe(true);
    expect(isSameSiteRelativeReference("./hero.jpg#intro")).toBe(true);
    expect(isSameSiteRelativeReference("assets/site.css")).toBe(true);
    expect(isSameSiteRelativeReference("https://example.com/pricing")).toBe(false);
    expect(isSameSiteRelativeReference("mailto:hello@example.com")).toBe(false);
    expect(isSameSiteRelativeReference("#faq")).toBe(false);
  });

  it("extracts supported reference types from built files", () => {
    const htmlReferences = extractReferencesFromFile(
      "index.html",
      '<link rel="stylesheet" href="assets/site.css"><img srcset="hero.jpg 1x, /images/hero@2x.jpg 2x"><script src="../assets/site.js"></script>',
    );
    const cssReferences = extractReferencesFromFile(
      "assets/site.css",
      '@import "../fonts/site.css"; .hero { background-image: url("../images/hero.png"); }',
    );
    const jsReferences = extractReferencesFromFile(
      "assets/site.js",
      'const module = import("../chunks/nav.js"); import "./boot.js";',
    );

    expect(htmlReferences).toEqual([
      "assets/site.css",
      "hero.jpg",
      "/images/hero@2x.jpg",
      "../assets/site.js",
    ]);
    expect(cssReferences).toEqual([
      "../images/hero.png",
      "../fonts/site.css",
    ]);
    expect(jsReferences).toEqual([
      "../chunks/nav.js",
      "./boot.js",
    ]);
  });

  it("accepts extensionless page routes and asset references that resolve inside dist", () => {
    const distDir = createTempDist();

    writeFixture(
      distDir,
      "index.html",
      [
        '<link rel="stylesheet" href="assets/site.css">',
        '<a href="/pricing">Pricing</a>',
        '<img srcset="images/hero.jpg 1x, /images/hero@2x.jpg 2x">',
        '<a href="https://example.com">External</a>',
      ].join("\n"),
    );
    writeFixture(distDir, "pricing/index.html", "<p>Pricing</p>");
    writeFixture(
      distDir,
      "assets/site.css",
      '.hero { background-image: url("../images/hero.png"); }',
    );
    writeFixture(distDir, "images/hero.jpg", "hero");
    writeFixture(distDir, "images/hero@2x.jpg", "hero-2x");
    writeFixture(distDir, "images/hero.png", "hero-bg");

    expect(findBrokenDistReferences(distDir)).toEqual([]);
  });

  it("reports missing same-site targets with the source file and normalized reference", () => {
    const distDir = createTempDist();

    writeFixture(
      distDir,
      "index.html",
      [
        '<a href="/missing-page">Missing page</a>',
        '<script src="assets/missing.js"></script>',
      ].join("\n"),
    );
    writeFixture(
      distDir,
      "assets/site.css",
      '.hero { background-image: url("../images/missing.png"); }',
    );

    expect(findBrokenDistReferences(distDir)).toEqual([
      expect.objectContaining({
        sourcePath: path.join(distDir, "assets", "site.css"),
        reference: "../images/missing.png",
        reason: "missing target",
      }),
      expect.objectContaining({
        sourcePath: path.join(distDir, "index.html"),
        reference: "/missing-page",
        reason: "missing target",
      }),
      expect.objectContaining({
        sourcePath: path.join(distDir, "index.html"),
        reference: "assets/missing.js",
        reason: "missing target",
      }),
    ]);
  });
});
