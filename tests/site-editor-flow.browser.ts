/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

import { createSiteEditorServer } from "../src/editor/site-editor-server.js";
import { SiteContentSchema, type SiteContentData } from "../src/schemas/site.schema.js";

const createDraft = (
  aboutTitle = "About LaunchKit",
  siteName = "LaunchKit",
): SiteContentData =>
  SiteContentSchema.parse({
    site: {
      name: siteName,
      baseUrl: "https://launchkit.example",
      theme: "friendly-modern",
      layout: {
        components: [
          {
            type: "navigation-bar",
            brandText: siteName,
            links: [
              {
                label: "Home",
                href: "/",
              },
            ],
          },
          {
            type: "page-content",
          },
        ],
      },
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
          ...Array.from({ length: 6 }, (_, index) => ({
            type: "prose",
            title: `About section ${index + 2}`,
            paragraphs: [
              "Structured content stays editable while the rendered preview keeps the final page shape.",
            ],
          })),
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
  const firstDir = path.join(tempDir, "first");
  const siblingDir = path.join(tempDir, "sibling");
  const firstContentPath = path.join(firstDir, "site.json");
  const siblingContentPath = path.join(siblingDir, "site.json");
  await writeJson(firstContentPath, createDraft("About FirstKit", "FirstKit"));
  await writeJson(siblingContentPath, createDraft("About SiblingKit", "SiblingKit"));
  const server = await createSiteEditorServer({ contentPath: firstDir });
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 720 },
    });
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(server.origin, { waitUntil: "domcontentloaded" });
    await page.locator("button", { hasText: "Site details" }).waitFor();
    assert.equal(await page.locator("h2").first().textContent(), "Site");
    await page.locator("button", { hasText: "Up one folder" }).click();
    await page.locator("button", { hasText: "[dir] sibling" }).click();
    await page.locator("button", { hasText: "SiblingKit" }).click();
    await page.waitForFunction(() => {
      const field = document.querySelector("[data-testid='field-name']");
      return field instanceof HTMLInputElement && field.value === "SiblingKit";
    });
    assert.equal(await page.locator("[data-testid='field-name']").inputValue(), "SiblingKit");
    await page.locator("[data-testid='field-brandText']").fill("SiblingKit Nav");
    await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("text=SiblingKit Nav")
      .waitFor();

    await page.locator("button", { hasText: "2. About" }).click();
    await page.locator("h2", { hasText: /^Page$/u }).waitFor();
    await page.locator("h2", { hasText: "Components" }).waitFor();
    assert.equal(await page.locator("label", { hasText: "Type" }).count(), 0);
    await page.frameLocator("[data-testid='preview-frame']").locator("text=About SiblingKit").waitFor();
    const scrollLayout = await page.evaluate(() => {
      const editorPanel = document.querySelector(".editor-panel");

      if (!(editorPanel instanceof HTMLElement)) {
        throw new Error("Expected editor panel to exist.");
      }

      return {
        documentCanScroll:
          document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
        editorCanScroll: editorPanel.scrollHeight > editorPanel.clientHeight + 1,
      };
    });
    const previewCanScroll = await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("body")
      .evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight + 1);

    assert.equal(scrollLayout.documentCanScroll, false);
    assert.equal(scrollLayout.editorCanScroll, true);
    assert.equal(previewCanScroll, true);

    await page.locator(".editor-panel").evaluate((editorPanel) => {
      editorPanel.scrollTop = 240;
    });
    await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("body")
      .evaluate(() => window.scrollTo(0, 240));
    const scrollPositions = await page.evaluate(() => {
      const editorPanel = document.querySelector(".editor-panel");

      if (!(editorPanel instanceof HTMLElement)) {
        throw new Error("Expected editor panel to exist.");
      }

      return {
        documentTop: document.documentElement.scrollTop,
        editorTop: editorPanel.scrollTop,
      };
    });
    const previewTop = await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("body")
      .evaluate(() => window.scrollY);
    const previewWindowMarker = await page.locator("[data-testid='preview-frame']").evaluate((iframe) => {
      if (!(iframe instanceof HTMLIFrameElement) || !iframe.contentWindow) {
        throw new Error("Expected preview iframe window to exist.");
      }

      const previewWindow = iframe.contentWindow as Window & { __cruftlessPreviewMarker?: string };
      previewWindow.__cruftlessPreviewMarker ??= Math.random().toString(36).slice(2);
      return previewWindow.__cruftlessPreviewMarker;
    });

    assert.equal(scrollPositions.documentTop, 0);
    assert.ok(scrollPositions.editorTop > 0);
    assert.ok(previewTop > 0);

    await page.locator("[data-testid='field-title']").nth(1).fill("Browser edited title");
    await page
      .frameLocator("[data-testid='preview-frame']")
      .locator("text=Browser edited title")
      .waitFor();
    const previewStateAfterEdit = await page.locator("[data-testid='preview-frame']").evaluate((iframe) => {
      if (!(iframe instanceof HTMLIFrameElement) || !iframe.contentWindow) {
        throw new Error("Expected preview iframe window to exist.");
      }

      const previewWindow = iframe.contentWindow as Window & { __cruftlessPreviewMarker?: string };
      return {
        marker: previewWindow.__cruftlessPreviewMarker,
        scrollTop: previewWindow.scrollY,
      };
    });
    await page.locator("button", { hasText: "Down" }).first().click();

    assert.equal(previewStateAfterEdit.marker, previewWindowMarker);
    assert.ok(previewStateAfterEdit.scrollTop >= previewTop);

    assert.equal((await readFile(siblingContentPath, "utf8")).includes("Browser edited title"), false);

    await page.locator("button", { hasText: "Save" }).click();
    await page.locator("[data-role='status']").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("[data-role='status']")?.textContent?.includes("Saved"));

    const savedDraft = SiteContentSchema.parse(JSON.parse(await readFile(siblingContentPath, "utf8")));
    const firstSavedComponent = savedDraft.pages[1]?.components[0];
    const secondSavedComponent = savedDraft.pages[1]?.components[1];
    const sharedNav = savedDraft.site.layout?.components[0];

    if (firstSavedComponent?.type !== "cta-band" || secondSavedComponent?.type !== "prose") {
      throw new Error("Expected the saved about page components to be reordered.");
    }

    assert.equal(secondSavedComponent.title, "Browser edited title");
    assert.equal(sharedNav?.type, "navigation-bar");
    assert.equal(sharedNav.brandText, "SiblingKit Nav");
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
};

await runBrowserRegression();
