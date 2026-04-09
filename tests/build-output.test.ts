import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSite, loadValidatedSite } from "../src/build/framework.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";

const waitForMtimeTick = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 30);
  });

const createScriptedSite = () =>
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
      {
        slug: "/about",
        title: "About",
        components: [
          {
            type: "prose",
            title: "About LaunchKit",
            paragraphs: ["Theme-driven static pages without custom templates."],
          },
        ],
      },
    ],
  });

const createStaticSite = () =>
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
              label: "Get started",
              href: "/start",
            },
          },
        ],
      },
    ],
  });

const createAnalyticsSite = () =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme: "friendly-modern",
      googleAnalyticsMeasurementId: "G-TEST1234",
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

describe("buildSite output writes", () => {
  it("does not rewrite unchanged files on repeated builds", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-output-"));

    try {
      await buildSite(createStaticSite(), outDir);

      const cssPath = path.join(outDir, "assets", "site.css");
      const htmlPath = path.join(outDir, "index.html");
      const initialCssStat = await stat(cssPath);
      const initialHtmlStat = await stat(htmlPath);

      await waitForMtimeTick();

      const secondBuild = await buildSite(createStaticSite(), outDir);
      const laterCssStat = await stat(cssPath);
      const laterHtmlStat = await stat(htmlPath);

      expect(secondBuild.filesCreated).toBe(0);
      expect(secondBuild.filesUpdated).toBe(0);
      expect(secondBuild.filesRemoved).toBe(0);
      expect(secondBuild.filesUnchanged).toBe(2);
      expect(laterCssStat.mtimeMs).toBe(initialCssStat.mtimeMs);
      expect(laterHtmlStat.mtimeMs).toBe(initialHtmlStat.mtimeMs);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("removes stale generated files when the rendered output no longer needs them", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-cleanup-"));

    try {
      await buildSite(createScriptedSite(), outDir);

      expect(await readFile(path.join(outDir, "assets", "site.js"), "utf8")).toContain(
        "resolveNavigationBarMode",
      );
      expect(await readFile(path.join(outDir, "about", "index.html"), "utf8")).toContain(
        "About LaunchKit",
      );

      const secondBuild = await buildSite(createStaticSite(), outDir);

      expect(secondBuild.filesRemoved).toBe(2);
      await expect(access(path.join(outDir, "assets", "site.js"))).rejects.toThrow();
      await expect(access(path.join(outDir, "about", "index.html"))).rejects.toThrow();
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("includes google analytics tags when a measurement ID is configured", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-analytics-"));

    try {
      await buildSite(createAnalyticsSite(), outDir);

      const html = await readFile(path.join(outDir, "index.html"), "utf8");

      expect(html).toContain(
        '<script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST1234"></script>',
      );
      expect(html).toContain(`gtag('config', "G-TEST1234");`);
      await expect(access(path.join(outDir, "assets", "site.js"))).rejects.toThrow();
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("copies referenced content preview images into dist and removes them when no longer needed", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-local-assets-"));
    const contentDir = path.join(projectRoot, "content");
    const previewsDir = path.join(contentDir, "examples", "previews");
    const contentPath = path.join(contentDir, "site.json");
    const outDir = path.join(projectRoot, "dist");
    const previewImagePath = path.join(previewsDir, "local-preview.png");

    try {
      await mkdir(previewsDir, { recursive: true });
      await writeFile(previewImagePath, "preview image bytes", "utf8");
      await writeFile(
        contentPath,
        `${JSON.stringify(
          {
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
                      label: "Get started",
                      href: "/start",
                    },
                  },
                  {
                    type: "media",
                    src: "content/examples/previews/local-preview.png",
                    alt: "Locally stored preview image",
                  },
                ],
              },
            ],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const firstBuild = await buildSite(await loadValidatedSite(contentPath), outDir, contentPath);
      const copiedPreviewPath = path.join(outDir, "examples", "previews", "local-preview.png");
      const html = await readFile(path.join(outDir, "index.html"), "utf8");

      expect(firstBuild.filesCreated).toBeGreaterThan(0);
      expect(await readFile(copiedPreviewPath, "utf8")).toBe("preview image bytes");
      expect(html).toContain('src="examples/previews/local-preview.png"');

      await writeFile(
        contentPath,
        `${JSON.stringify(
          {
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
                      label: "Get started",
                      href: "/start",
                    },
                  },
                ],
              },
            ],
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      const secondBuild = await buildSite(await loadValidatedSite(contentPath), outDir, contentPath);

      expect(secondBuild.filesRemoved).toBeGreaterThan(0);
      await expect(access(copiedPreviewPath)).rejects.toThrow();
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("renders local content asset URLs as relative paths for nested pages and site CSS", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-local-asset-hrefs-"));
    const contentDir = path.join(projectRoot, "content");
    const previewsDir = path.join(contentDir, "images");
    const contentPath = path.join(contentDir, "site.json");
    const outDir = path.join(projectRoot, "dist");
    const previewImagePath = path.join(previewsDir, "landing-page.jpg");

    try {
      await mkdir(previewsDir, { recursive: true });
      await writeFile(previewImagePath, "preview image bytes", "utf8");
      const siteContent = {
        site: {
          name: "LaunchKit",
          baseUrl: "https://launchkit.example",
          theme: "friendly-modern",
          pageBackgroundImageUrl: "/content/images/landing-page.jpg",
        },
        pages: [
          {
            slug: "/gallery",
            title: "Gallery",
            components: [
              {
                type: "media",
                src: "/content/images/landing-page.jpg",
                alt: "Locally stored gallery image",
                size: "wide",
              },
            ],
          },
        ],
      };

      await writeFile(contentPath, `${JSON.stringify(siteContent, null, 2)}\n`, "utf8");
      await buildSite(siteContent as Parameters<typeof buildSite>[0], outDir, contentPath);

      const nestedHtml = await readFile(path.join(outDir, "gallery", "index.html"), "utf8");
      const css = await readFile(path.join(outDir, "assets", "site.css"), "utf8");
      const copiedPreviewPath = path.join(outDir, "images", "landing-page.jpg");

      expect(await readFile(copiedPreviewPath, "utf8")).toBe("preview image bytes");
      expect(nestedHtml).toContain('src="../images/landing-page.jpg"');
      expect(css).toContain('url("../images/landing-page.jpg")');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it("copies and rewrites content-relative navigation brand images", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-navbar-brand-image-"));
    const contentDir = path.join(projectRoot, "content");
    const imagesDir = path.join(contentDir, "Images");
    const contentPath = path.join(contentDir, "site.json");
    const outDir = path.join(projectRoot, "dist");
    const brandImagePath = path.join(imagesDir, "brand-logo.webp");

    try {
      await mkdir(imagesDir, { recursive: true });
      await writeFile(brandImagePath, "brand image bytes", "utf8");
      const siteContent = {
        site: {
          name: "LaunchKit",
          baseUrl: "https://launchkit.example",
          theme: "friendly-modern",
          layout: {
            components: [
              {
                type: "navigation-bar",
                brandText: "LaunchKit",
                brandImage: {
                  src: "Images/brand-logo.webp",
                  alt: "LaunchKit logo",
                },
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
            slug: "/about",
            title: "About",
            components: [
              {
                type: "prose",
                title: "About LaunchKit",
                paragraphs: ["Built for content-relative assets."],
              },
            ],
          },
        ],
      };

      await writeFile(contentPath, `${JSON.stringify(siteContent, null, 2)}\n`, "utf8");
      await buildSite(siteContent as Parameters<typeof buildSite>[0], outDir, contentPath);

      const aboutHtml = await readFile(path.join(outDir, "about", "index.html"), "utf8");
      const copiedBrandImagePath = path.join(outDir, "Images", "brand-logo.webp");

      expect(await readFile(copiedBrandImagePath, "utf8")).toBe("brand image bytes");
      expect(aboutHtml).toContain('src="../Images/brand-logo.webp"');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
