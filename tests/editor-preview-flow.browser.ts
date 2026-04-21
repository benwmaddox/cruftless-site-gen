/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium, type Page } from "playwright";

import { createEditorPreviewServer } from "../src/build/editor-preview-server.js";
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
            type: "gallery",
            title: "Homepage gallery",
            images: [
              {
                src: "https://launchkit.example/gallery.jpg",
                alt: "Gallery image",
              },
              {
                src: "https://launchkit.example/gallery-2.jpg",
                alt: "Second gallery image",
              },
            ],
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
        ],
      },
    ],
  });

const expectMissingFile = async (filePath: string): Promise<void> => {
  await assert.rejects(stat(filePath), { code: "ENOENT" });
};

const waitForBodyText = async (page: Page, text: string): Promise<void> => {
  await page.waitForFunction(
    (expectedText) => document.body.textContent?.includes(expectedText) ?? false,
    text,
  );
};

const runBrowserRegression = async (): Promise<void> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-editor-flow-browser-"));
  const contentPath = path.join(tempDir, "site.json");
  const server = await createEditorPreviewServer(createDraft(), { contentPath });
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(`${server.origin}/about`, {
      waitUntil: "domcontentloaded",
    });
    await waitForBodyText(page, "About LaunchKit");

    assert.equal(await page.locator("h2").first().textContent(), "About LaunchKit");
    assert.equal(await page.locator("text=Homepage gallery").count(), 0);
    await expectMissingFile(contentPath);

    const draftResponse = await fetch(`${server.origin}/__preview/draft`, {
      body: JSON.stringify(createDraft("Unsaved browser edit")),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    assert.equal(draftResponse.status, 204);

    await waitForBodyText(page, "Unsaved browser edit");
    assert.equal(await page.locator("h2").first().textContent(), "Unsaved browser edit");
    await expectMissingFile(contentPath);

    const saveResponse = await fetch(`${server.origin}/__preview/save`, {
      method: "POST",
    });
    assert.equal(saveResponse.status, 204);

    await waitForBodyText(page, "Unsaved browser edit");
    const savedDraft = SiteContentSchema.parse(JSON.parse(await readFile(contentPath, "utf8")));
    const savedComponent = savedDraft.pages[1]?.components[0];

    if (savedComponent?.type !== "prose") {
      throw new Error("Expected the saved about page component to be prose.");
    }

    assert.equal(savedComponent.title, "Unsaved browser edit");
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
};

await runBrowserRegression();
