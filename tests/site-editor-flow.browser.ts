/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

import { createSiteEditorServer } from "../src/editor/site-editor-server.js";
import { SiteContentSchema, type SiteContentData } from "../src/schemas/site.schema.js";

const createDraft = (aboutTitle = "About LaunchKit"): SiteContentData =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme: "friendly-modern",
    },
    pages: [
      {
        slug: "/",
        title: "Home",
        components: [
          {
            type: "hero",
            headline: "Launch faster",
            primaryCta: {
              label: "Start",
              href: "/start",
            },
          },
        ],
      },
      {
        slug: "/about",
        title: "About",
        components: [
          {
            type: "prose",
            title: aboutTitle,
            paragraphs: ["Theme-driven static pages without custom templates."],
          },
          {
            type: "cta-band",
            headline: "Ready to launch?",
            primaryCta: {
              label: "Contact us",
              href: "/contact",
            },
          },
        ],
      },
    ],
  });

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const runBrowserRegression = async (): Promise<void> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-browser-"));
  const contentPath = path.join(tempDir, "site.json");
  await writeJson(contentPath, createDraft());
  const server = await createSiteEditorServer({ contentPath: tempDir });
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 920 },
    });
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(server.origin, { waitUntil: "domcontentloaded" });
    await page.locator("button", { hasText: "Site details" }).waitFor();
    assert.equal(await page.locator("h2").first().textContent(), "Site");

    await page.locator("button", { hasText: "2. About" }).click();
    await page.locator("h2", { hasText: "Page" }).waitFor();
    await page.locator("h2", { hasText: "Components" }).waitFor();
    assert.equal(await page.locator("label", { hasText: "Type" }).count(), 0);
    await page.frameLocator("[data-testid='preview-frame']").locator("text=About LaunchKit").waitFor();

    await page.locator("[data-testid='field-title']").last().fill("Browser edited title");
    await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("text=Browser edited title")
      .waitFor();
    await page.locator("button", { hasText: "Down" }).first().click();

    assert.equal((await readFile(contentPath, "utf8")).includes("Browser edited title"), false);

    await page.locator("button", { hasText: "Save" }).click();
    await page.locator("[data-role='status']").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("[data-role='status']")?.textContent?.includes("Saved"));

    const savedDraft = SiteContentSchema.parse(JSON.parse(await readFile(contentPath, "utf8")));
    const firstSavedComponent = savedDraft.pages[1]?.components[0];
    const secondSavedComponent = savedDraft.pages[1]?.components[1];

    if (firstSavedComponent?.type !== "cta-band" || secondSavedComponent?.type !== "prose") {
      throw new Error("Expected the saved about page components to be reordered.");
    }

    assert.equal(secondSavedComponent.title, "Browser edited title");
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
};

await runBrowserRegression();
