/// <reference lib="dom" />

import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { chromium, type Page } from "playwright";

import { buildSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";

const contentTypeByExtension: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const navigationBarSelector = '.c-navbar[data-js="navigation-bar"]';
const largeViewport = { width: 1280, height: 900 };
const smallViewport = { width: 280, height: 900 };

const createNavigationBarFixture = () =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme: "app-announcement",
      layout: {
        components: [
          {
            type: "navigation-bar",
            brandText: "LaunchKit Enterprise",
            links: [
              {
                label: "Product Overview",
                href: "/",
              },
              {
                label: "Pricing Plans",
                href: "/pricing",
              },
              {
                label: "Customer Stories",
                href: "/stories",
              },
              {
                label: "Contact Sales",
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
            type: "hero",
            headline: "Launch faster",
            primaryCta: {
              label: "Get started",
              href: "/start",
            },
          },
        ],
      },
    ],
  });

const resolveRequestPath = async (
  outDir: string,
  request: IncomingMessage,
): Promise<string | null> => {
  const requestPath = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relativePath = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const candidatePath = path.resolve(outDir, relativePath);

  if (path.relative(outDir, candidatePath).startsWith("..")) {
    return null;
  }

  const candidateStats = await stat(candidatePath).catch(() => null);
  if (candidateStats?.isDirectory()) {
    return path.join(candidatePath, "index.html");
  }

  if (candidateStats?.isFile()) {
    return candidatePath;
  }

  const indexPath = path.resolve(outDir, relativePath, "index.html");
  if (path.relative(outDir, indexPath).startsWith("..")) {
    return null;
  }

  const indexStats = await stat(indexPath).catch(() => null);
  return indexStats?.isFile() ? indexPath : null;
};

const createStaticServer = async (
  outDir: string,
): Promise<{ close: () => Promise<void>; origin: string }> => {
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const filePath = await resolveRequestPath(outDir, request);
      if (!filePath) {
        response.writeHead(404).end("Not found");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type":
          contentTypeByExtension[path.extname(filePath)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve static server address.");
  }

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
    origin: `http://127.0.0.1:${address.port}`,
  };
};

const waitForNavigationBarMode = async (page: Page, mode: "collapsed" | "inline") => {
  try {
    await page.waitForFunction(
      ({ expectedMode, selector }) => {
        return (
          document.querySelector(selector)?.getAttribute("data-navigation-bar-mode") === expectedMode
        );
      },
      {
        expectedMode: mode,
        selector: navigationBarSelector,
      },
    );
  } catch (error) {
    const snapshot = await page.evaluate((selector) => {
      const navbar = document.querySelector(selector);
      const row = navbar?.querySelector(".c-navbar__inner");
      const brand = navbar?.querySelector(".c-navbar__brand");
      const measure = navbar?.querySelector(".c-navbar__measure");
      const button = navbar?.querySelector(".c-navbar__menu-button");

      return {
        buttonDisplay:
          button instanceof HTMLElement ? window.getComputedStyle(button).display : null,
        brandWidth:
          brand instanceof HTMLElement ? brand.getBoundingClientRect().width : null,
        gap:
          row instanceof HTMLElement
            ? window.getComputedStyle(row).columnGap || window.getComputedStyle(row).gap
            : null,
        mode: navbar?.getAttribute("data-navigation-bar-mode") ?? null,
        navWidth: measure instanceof HTMLElement ? measure.scrollWidth : null,
        rowWidth: row instanceof HTMLElement ? row.clientWidth : null,
        viewportWidth: window.innerWidth,
      };
    }, navigationBarSelector);

    throw new Error(
      `Timed out waiting for navigation bar mode '${mode}'. Snapshot: ${JSON.stringify(snapshot)}`,
      { cause: error },
    );
  }
};

const expectPanelHidden = async (page: Page, hidden: boolean) => {
  await page.waitForFunction(
    ({ expectedHidden, selector }) => {
      const panel = document.querySelector(`${selector} .c-navbar__panel`);
      return panel instanceof HTMLElement && panel.hidden === expectedHidden;
    },
    {
      expectedHidden: hidden,
      selector: navigationBarSelector,
    },
  );
};

const runBrowserRegression = async (): Promise<void> => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-navbar-browser-"));
  let closeServer: (() => Promise<void>) | undefined;

  try {
    await buildSite(createNavigationBarFixture(), outDir);
    const server = await createStaticServer(outDir);
    closeServer = server.close;

    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({
        viewport: largeViewport,
      });
      const pageErrors: string[] = [];

      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await page.goto(`${server.origin}/`, {
        waitUntil: "networkidle",
      });
      assert.deepEqual(pageErrors, []);

      await waitForNavigationBarMode(page, "inline");

      await page.setViewportSize(smallViewport);

      await waitForNavigationBarMode(page, "collapsed");
      assert.equal(
        await page.locator(`${navigationBarSelector} .c-navbar__menu-button`).isVisible(),
        true,
      );

      await page.reload({
        waitUntil: "networkidle",
      });

      await waitForNavigationBarMode(page, "collapsed");
      await expectPanelHidden(page, true);

      const menuButton = page.locator(`${navigationBarSelector} .c-navbar__menu-button`);
      await menuButton.click();
      await expectPanelHidden(page, false);
      assert.equal(await menuButton.getAttribute("aria-expanded"), "true");

      await page.setViewportSize(largeViewport);

      await waitForNavigationBarMode(page, "inline");
      await expectPanelHidden(page, true);
      assert.equal(await menuButton.getAttribute("aria-expanded"), "false");
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
