/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

import {
  buildThemeExamples,
  themePreviewImageDir,
  themePreviewViewport,
} from "../src/build/theme-example-previews.js";
import { createStaticServer } from "../src/build/static-server.js";
import { themeNames } from "../src/themes/index.js";

const runBrowserRegression = async (): Promise<void> => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-example-previews-"));
  let closeServer: (() => Promise<void>) | undefined;

  try {
    const buildResult = await buildThemeExamples(outDir);
    assert.equal(buildResult.builtPages, themeNames.length + 1);
    assert.equal(buildResult.previewCount, themeNames.length);

    await Promise.all(
      themeNames.map((themeName) =>
        stat(path.join(outDir, themePreviewImageDir, `${themeName}.png`)),
      ),
    );

    const server = await createStaticServer(outDir);
    closeServer = server.close;

    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
      const pageErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await page.goto(`${server.origin}/`, {
        waitUntil: "networkidle",
      });

      const metrics = await page.locator(".c-feature-grid__item--stacked-image").first().evaluate(
        (item) => {
          const image = item.querySelector(".c-feature-grid__item-image");
          const title = item.querySelector(".c-feature-grid__item-title");

          if (!(image instanceof HTMLImageElement) || !(title instanceof HTMLElement)) {
            throw new Error("Expected a stacked feature-grid card with an image and title.");
          }

          const itemRect = item.getBoundingClientRect();
          const imageRect = image.getBoundingClientRect();
          const titleRect = title.getBoundingClientRect();

          return {
            imageBottom: imageRect.bottom,
            imageNaturalHeight: image.naturalHeight,
            imageNaturalWidth: image.naturalWidth,
            imageWidth: imageRect.width,
            itemWidth: itemRect.width,
            titleTop: titleRect.top,
          };
        },
      );

      assert.equal(metrics.imageNaturalWidth, themePreviewViewport.width);
      assert.equal(metrics.imageNaturalHeight, themePreviewViewport.height);
      assert.ok(metrics.imageWidth >= metrics.itemWidth * 0.8);
      assert.ok(metrics.titleTop >= metrics.imageBottom);
      assert.deepEqual(pageErrors, []);
    } finally {
      await browser.close();
    }
  } finally {
    if (closeServer) {
      await closeServer();
    }

    await rm(outDir, { recursive: true, force: true });
  }
};

await runBrowserRegression();
