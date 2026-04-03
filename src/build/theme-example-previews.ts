import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

import { chromium, type BrowserContext, type Page } from "playwright";

import { themeNames, type ThemeName } from "../themes/index.js";
import { ValidationFailure, buildSiteFromFile } from "./framework.js";
import { createStaticServer } from "./static-server.js";

export const examplesContentDir = path.resolve(process.cwd(), "content/examples/themes");
export const examplesOutDir = path.resolve(process.cwd(), "dist/examples");
export const examplesIndexContentPath = path.join(examplesContentDir, "index.json");
export const themePreviewImageDir = path.join("assets", "previews");
export const themePreviewViewport = {
  width: 390,
  height: 700,
} as const;

export interface ThemeExampleBuildResult {
  builtPages: number;
  previewCount: number;
}

export const themePreviewImageHref = (themeName: ThemeName): string =>
  path.posix.join(themePreviewImageDir, `${themeName}.png`);

const themePreviewOutputPath = (outDir: string, themeName: ThemeName): string =>
  path.join(outDir, themePreviewImageDir, `${themeName}.png`);

const waitForPreviewToRender = async (page: Page): Promise<void> => {
  await page.waitForLoadState("load");
  await page.waitForSelector("body");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      }),
  );
};

const allowOnlyLocalRequests = async (
  browserContext: BrowserContext,
  origin: string,
): Promise<void> => {
  await browserContext.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (
      requestUrl === "about:blank" ||
      requestUrl.startsWith("data:") ||
      requestUrl.startsWith(origin)
    ) {
      await route.continue();
      return;
    }

    await route.abort();
  });
};

const removeStalePreviewImages = async (
  outDir: string,
  expectedPaths: ReadonlySet<string>,
): Promise<void> => {
  const previewDirPath = path.join(outDir, themePreviewImageDir);
  const entries = await readdir(previewDirPath, { withFileTypes: true }).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(previewDirPath, entry.name);
      if (entry.isFile() && !expectedPaths.has(entryPath)) {
        await rm(entryPath, { force: true });
      }
    }),
  );
};

export const generateThemePreviewScreenshots = async (
  outDir: string,
  themesToRender: readonly ThemeName[] = themeNames,
): Promise<number> => {
  const previewDirPath = path.join(outDir, themePreviewImageDir);
  const expectedPreviewPaths = new Set(
    themesToRender.map((themeName) => themePreviewOutputPath(outDir, themeName)),
  );
  await mkdir(previewDirPath, { recursive: true });
  await removeStalePreviewImages(outDir, expectedPreviewPaths);

  const server = await createStaticServer(outDir);
  const browser = await chromium.launch();

  try {
    const browserContext = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: themePreviewViewport,
    });
    await allowOnlyLocalRequests(browserContext, server.origin);

    try {
      for (const themeName of themesToRender) {
        const page = await browserContext.newPage();
        const pageErrors: string[] = [];
        page.on("pageerror", (error) => {
          pageErrors.push(error.message);
        });

        await page.goto(`${server.origin}/${themeName}/`, {
          waitUntil: "domcontentloaded",
        });
        await waitForPreviewToRender(page);
        await page.screenshot({
          path: themePreviewOutputPath(outDir, themeName),
          type: "png",
        });
        await page.close();

        if (pageErrors.length > 0) {
          throw new Error(
            `Theme preview screenshot failed for ${themeName}: ${pageErrors.join("; ")}`,
          );
        }
      }
    } finally {
      await browserContext.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  return themesToRender.length;
};

export const buildThemeExamples = async (
  outDir: string = examplesOutDir,
  contentDir: string = examplesContentDir,
): Promise<ThemeExampleBuildResult> => {
  let builtPages = 0;
  const indexContentPath = path.join(contentDir, "index.json");
  const examplesIndex = await buildSiteFromFile(indexContentPath, outDir);
  builtPages += examplesIndex.pages.length;

  for (const themeName of themeNames) {
    const contentPath = path.join(contentDir, `${themeName}.json`);
    const themeOutDir = path.join(outDir, themeName);
    const siteContent = await buildSiteFromFile(contentPath, themeOutDir);
    builtPages += siteContent.pages.length;
  }

  const previewCount = await generateThemePreviewScreenshots(outDir, themeNames);

  return {
    builtPages,
    previewCount,
  };
};

export { ValidationFailure };
