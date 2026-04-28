/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

import { buildSiteFromFile } from "../src/build/framework.js";
import { createStaticServer } from "../src/build/static-server.js";

const contentPath = path.resolve(
  process.cwd(),
  "content/examples/themes/friendly-modern.json",
);

const runBrowserRegression = async (): Promise<void> => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-rich-components-"));
  let closeServer: (() => Promise<void>) | undefined;

  try {
    await buildSiteFromFile(contentPath, outDir);

    const server = await createStaticServer(outDir);
    closeServer = server.close;

    const browser = await chromium.launch();

    try {
      const desktopPage = await browser.newPage({
        viewport: { width: 1280, height: 1600 },
      });
      const pageErrors: string[] = [];

      desktopPage.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await desktopPage.goto(`${server.origin}/`, {
        waitUntil: "networkidle",
      });

      await desktopPage.locator(".c-gallery__trigger").first().click();
      await assert.doesNotReject(() =>
        desktopPage.waitForFunction(() => {
          const gallery = document.querySelector(".c-gallery");
          const dialog = document.querySelector(".c-gallery__dialog");

          return (
            gallery instanceof HTMLElement &&
            dialog instanceof HTMLElement &&
            gallery.dataset.galleryOpen === "true" &&
            !dialog.hidden
          );
        }),
      );

      const dialogCaption = await desktopPage.locator(".c-gallery__dialog-caption").textContent();
      assert.ok(dialogCaption);

      await desktopPage.keyboard.press("Escape");
      const closedDialogState = await desktopPage.evaluate(() => {
        const gallery = document.querySelector(".c-gallery");
        const dialog = document.querySelector(".c-gallery__dialog");
        const dialogImage = document.querySelector(".c-gallery__dialog-image");

        if (
          !(gallery instanceof HTMLElement) ||
          !(dialog instanceof HTMLElement) ||
          !(dialogImage instanceof HTMLImageElement)
        ) {
          throw new Error("Expected gallery dialog to be present.");
        }

        const rect = dialog.getBoundingClientRect();

        return {
          display: getComputedStyle(dialog).display,
          galleryOpen: gallery.dataset.galleryOpen,
          height: rect.height,
          hidden: dialog.hidden,
          imageSrc: dialogImage.getAttribute("src"),
          width: rect.width,
        };
      });

      assert.deepEqual(closedDialogState, {
        display: "none",
        galleryOpen: "false",
        height: 0,
        hidden: true,
        imageSrc: null,
        width: 0,
      });

      const desktopMetrics = await desktopPage.evaluate(() => {
        const imageTextInner = document.querySelector(".c-image-text__inner");
        const beforeAfterItems = Array.from(document.querySelectorAll(".c-before-after__item"));
        const galleryItems = Array.from(document.querySelectorAll(".c-gallery__item"));
        const testimonialItems = Array.from(document.querySelectorAll(".c-testimonials__item"));
        const logoImages = Array.from(document.querySelectorAll(".c-logo-strip__image"));

        if (!(imageTextInner instanceof HTMLElement)) {
          throw new Error("Expected image-text section to be present.");
        }

        if (
          beforeAfterItems.length < 2 ||
          galleryItems.length < 3 ||
          testimonialItems.length < 3 ||
          logoImages.length < 4
        ) {
          throw new Error("Expected all image-rich showcase sections to render.");
        }

        const beforeAfterFirstTop = beforeAfterItems[0]?.getBoundingClientRect().top;
        const galleryFirstTop = galleryItems[0]?.getBoundingClientRect().top;
        const testimonialFirstTop = testimonialItems[0]?.getBoundingClientRect().top;

        if (
          beforeAfterFirstTop === undefined ||
          galleryFirstTop === undefined ||
          testimonialFirstTop === undefined
        ) {
          throw new Error("Expected showcase cards to have measurable layout.");
        }

        return {
          imageTextColumns: getComputedStyle(imageTextInner).gridTemplateColumns.split(" ").length,
          beforeAfterRowCount: beforeAfterItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - beforeAfterFirstTop) < 1,
          ).length,
          galleryRowCount: galleryItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - galleryFirstTop) < 1,
          ).length,
          testimonialRowCount: testimonialItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - testimonialFirstTop) < 1,
          ).length,
          visibleLogoCount: logoImages.filter((image) => {
            if (!(image instanceof HTMLImageElement)) {
              return false;
            }

            const rect = image.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length,
        };
      });

      assert.equal(desktopMetrics.imageTextColumns, 2);
      assert.equal(desktopMetrics.beforeAfterRowCount, 2);
      assert.equal(desktopMetrics.galleryRowCount, 3);
      assert.equal(desktopMetrics.testimonialRowCount, 3);
      assert.ok(desktopMetrics.visibleLogoCount >= 4);

      const mobilePage = await browser.newPage({
        viewport: { width: 390, height: 1200 },
      });

      mobilePage.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await mobilePage.goto(`${server.origin}/`, {
        waitUntil: "networkidle",
      });

      const mobileMetrics = await mobilePage.evaluate(() => {
        const documentElement = document.documentElement;
        const imageTextInner = document.querySelector(".c-image-text__inner");
        const imageTextMedia = document.querySelector(".c-image-text__media");
        const imageTextImage = document.querySelector(".c-image-text__image");
        const beforeAfterItems = Array.from(document.querySelectorAll(".c-before-after__item"));
        const galleryItems = Array.from(document.querySelectorAll(".c-gallery__item"));
        const testimonialItems = Array.from(document.querySelectorAll(".c-testimonials__item"));

        if (!(imageTextInner instanceof HTMLElement)) {
          throw new Error("Expected image-text section to be present.");
        }

        if (!(imageTextMedia instanceof HTMLElement) || !(imageTextImage instanceof HTMLElement)) {
          throw new Error("Expected image-text media and image to be present.");
        }

        const beforeAfterFirstTop = beforeAfterItems[0]?.getBoundingClientRect().top;
        const galleryFirstTop = galleryItems[0]?.getBoundingClientRect().top;
        const testimonialFirstTop = testimonialItems[0]?.getBoundingClientRect().top;
        const mediaRect = imageTextMedia.getBoundingClientRect();
        const imageRect = imageTextImage.getBoundingClientRect();

        if (
          beforeAfterFirstTop === undefined ||
          galleryFirstTop === undefined ||
          testimonialFirstTop === undefined
        ) {
          throw new Error("Expected showcase cards to have measurable layout.");
        }

        return {
          documentOverflow: documentElement.scrollWidth - documentElement.clientWidth,
          imageFitsMedia: imageRect.width <= mediaRect.width + 1,
          imageTextColumns: getComputedStyle(imageTextInner).gridTemplateColumns.split(" ").length,
          beforeAfterRowCount: beforeAfterItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - beforeAfterFirstTop) < 1,
          ).length,
          galleryRowCount: galleryItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - galleryFirstTop) < 1,
          ).length,
          testimonialRowCount: testimonialItems.filter(
            (item) => Math.abs(item.getBoundingClientRect().top - testimonialFirstTop) < 1,
          ).length,
        };
      });

      assert.ok(mobileMetrics.documentOverflow <= 1);
      assert.equal(mobileMetrics.imageFitsMedia, true);
      assert.equal(mobileMetrics.imageTextColumns, 1);
      assert.equal(mobileMetrics.beforeAfterRowCount, 1);
      assert.equal(mobileMetrics.galleryRowCount, 1);
      assert.equal(mobileMetrics.testimonialRowCount, 1);
      assert.deepEqual(pageErrors, []);

      await desktopPage.close();
      await mobilePage.close();
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
