/// <reference lib="dom" />

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium } from "playwright";

import { buildSite } from "../src/build/framework.js";
import { createStaticServer } from "../src/build/static-server.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";

const phoneViewport = { width: 390, height: 844 };

const createShortPageFixture = () =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme: "friendly-modern",
      layout: {
        components: [
          {
            type: "navigation-bar",
            brandText: "LaunchKit",
            links: [
              {
                label: "Home",
                href: "/",
              },
              {
                label: "Contact",
                href: "/contact",
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
            type: "prose",
            title: "Short page",
            paragraphs: ["This page is intentionally short so the layout must fill the viewport."],
          },
        ],
      },
    ],
  });

const runBrowserRegression = async (): Promise<void> => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-full-height-browser-"));
  let closeServer: (() => Promise<void>) | undefined;

  try {
    await buildSite(createShortPageFixture(), outDir);
    const server = await createStaticServer(outDir);
    closeServer = server.close;

    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({
        viewport: phoneViewport,
      });
      const pageErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await page.goto(`${server.origin}/`, {
        waitUntil: "networkidle",
      });

      const metrics = await page.evaluate(() => {
        const pageRoot = document.querySelector(".l-page");

        if (!(pageRoot instanceof HTMLElement)) {
          throw new Error("Expected the page root element to exist.");
        }

        return {
          bodyHeight: document.body.getBoundingClientRect().height,
          bottomSlack:
            pageRoot.getBoundingClientRect().bottom -
            Array.from(pageRoot.children).at(-1)!.getBoundingClientRect().bottom,
          firstChildHeight: Array.from(pageRoot.children).at(0)!.getBoundingClientRect().height,
          pageHeight: pageRoot.getBoundingClientRect().height,
          viewportHeight: window.innerHeight,
        };
      });

      assert.ok(metrics.bodyHeight >= metrics.viewportHeight - 1);
      assert.ok(metrics.bottomSlack > 24);
      assert.ok(metrics.firstChildHeight < metrics.viewportHeight * 0.3);
      assert.ok(metrics.pageHeight >= metrics.viewportHeight - 1);
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
