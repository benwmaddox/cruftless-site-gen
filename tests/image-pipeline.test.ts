import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { buildSiteFromFile, loadValidatedSite } from "../src/build/framework.js";
import { collectWatchableLocalImagePaths } from "../src/build/image-pipeline.js";
import { SiteContentSchema } from "../src/schemas/site.schema.js";

interface LocalProjectFixture {
  contentPath: string;
  imagePath: string;
  rootDir: string;
}

const createLocalImage = async (
  filePath: string,
  width: number,
  height: number,
): Promise<void> => {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#7a8f74",
    },
  })
    .png()
    .toFile(filePath);
};

const removeDirectory = async (directoryPath: string): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(directoryPath, { recursive: true, force: true });
      return;
    } catch (error) {
      const errorCode = (error as NodeJS.ErrnoException).code;

      if ((errorCode === "EBUSY" || errorCode === "EPERM") && attempt < 19) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        continue;
      }

      throw error;
    }
  }
};

const createLocalImageProject = async (
  width: number,
  height: number,
): Promise<LocalProjectFixture> => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-pipeline-"));
  const contentDir = path.join(rootDir, "content");
  const imageDir = path.join(contentDir, "images");
  const imagePath = path.join(imageDir, "showroom.png");
  const contentPath = path.join(contentDir, "site.json");

  await mkdir(imageDir, { recursive: true });
  await createLocalImage(imagePath, width, height);

  const siteContent = SiteContentSchema.parse({
    site: {
      name: "Local Image Studio",
      baseUrl: "https://local-image-studio.example",
      theme: "friendly-modern",
    },
    pages: [
      {
        slug: "/",
        title: "Home",
        components: [
          {
            type: "gallery",
            title: "Project photography",
            columns: "3",
            images: [
              {
                src: "images/showroom.png",
                alt: "Refinished showroom seating area",
                caption: "Main showroom",
              },
              {
                src: "images/showroom.png",
                alt: "Refinished showroom reception detail",
                caption: "Reception",
              },
            ],
          },
          {
            type: "media",
            src: "images/showroom.png",
            alt: "Refinished showroom seating area",
            size: "content",
            caption: "Media section",
          },
        ],
      },
      {
        slug: "/portfolio",
        title: "Portfolio",
        components: [
          {
            type: "gallery",
            title: "Portfolio gallery",
            columns: "3",
            images: [
              {
                src: "images/showroom.png",
                alt: "Refinished showroom seating area",
              },
              {
                src: "images/showroom.png",
                alt: "Refinished showroom reception detail",
              },
            ],
          },
        ],
      },
    ],
  });

  await writeFile(contentPath, JSON.stringify(siteContent, null, 2));

  return {
    contentPath,
    imagePath,
    rootDir,
  };
};

describe("image pipeline", () => {
  it("rejects local raster images that are smaller than the required component slot", async () => {
    const fixture = await createLocalImageProject(480, 320);

    try {
      await expect(loadValidatedSite(fixture.contentPath)).rejects.toThrow(
        /source image width 480px is smaller than required 560px for gallery-thumb-3/,
      );
    } finally {
      await removeDirectory(fixture.rootDir);
    }
  });

  it("optimizes local content images into assets and rewrites page HTML to reference them there", async () => {
    const fixture = await createLocalImageProject(1800, 1200);
    const outDir = path.join(fixture.rootDir, "dist");

    try {
      await buildSiteFromFile(fixture.contentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const portfolioHtml = await readFile(path.join(outDir, "portfolio", "index.html"), "utf8");
      const outputImagesDir = path.join(outDir, "assets", "images");
      const outputImageNames = await readdir(outputImagesDir);
      const mediaOutputName = outputImageNames.find((name) =>
        name.startsWith("showroom-media-content-"),
      );
      const fullOutputName = outputImageNames.find((name) =>
        name.startsWith("showroom-gallery-full-"),
      );
      const thumbOutputName = outputImageNames.find((name) =>
        name.startsWith("showroom-gallery-thumb-3-"),
      );

      if (!mediaOutputName || !fullOutputName || !thumbOutputName) {
        throw new Error(`missing optimized image output: ${outputImageNames.join(", ")}`);
      }

      const sourceStats = await stat(fixture.imagePath);
      const mediaOutputPath = path.join(outputImagesDir, mediaOutputName);
      const mediaOutputStats = await stat(mediaOutputPath);
      const mediaOutputMetadata = await sharp(mediaOutputPath).metadata();

      expect(mediaOutputStats.size).toBeLessThan(sourceStats.size);
      expect(mediaOutputMetadata.width).toBe(1280);
      expect(homeHtml).toContain(`src="assets/images/${mediaOutputName}"`);
      expect(homeHtml).toContain(`data-gallery-full-src="assets/images/${fullOutputName}"`);
      expect(portfolioHtml).toContain(`src="../assets/images/${thumbOutputName}"`);
      expect(portfolioHtml).toContain(`data-gallery-full-src="../assets/images/${fullOutputName}"`);
      await expect(readdir(path.join(outDir, "images"))).rejects.toThrow();
    } finally {
      await removeDirectory(fixture.rootDir);
    }
  });

  it("collects unique local image dependencies for watch mode", async () => {
    const fixture = await createLocalImageProject(1800, 1200);

    try {
      const siteContent = await loadValidatedSite(fixture.contentPath);
      const watchablePaths = collectWatchableLocalImagePaths(siteContent, fixture.contentPath);

      expect(watchablePaths).toEqual([fixture.imagePath]);
    } finally {
      await removeDirectory(fixture.rootDir);
    }
  });

  it("collects local page background dependencies for watch mode", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-pipeline-background-"));
    const contentDir = path.join(rootDir, "content");
    const imageDir = path.join(contentDir, "images");
    const imagePath = path.join(imageDir, "background.png");
    const contentPath = path.join(contentDir, "site.json");

    try {
      await mkdir(imageDir, { recursive: true });
      await createLocalImage(imagePath, 1800, 1200);

      const siteContent = SiteContentSchema.parse({
        site: {
          name: "Local Image Studio",
          baseUrl: "https://local-image-studio.example",
          theme: "friendly-modern",
          pageBackgroundImageUrl: "/content/images/background.png",
        },
        pages: [
          {
            slug: "/",
            title: "Home",
            components: [
              {
                type: "hero",
                headline: "Welcome",
                primaryCta: {
                  label: "Start",
                  href: "/start",
                },
              },
            ],
          },
        ],
      });

      await writeFile(contentPath, JSON.stringify(siteContent, null, 2));

      const loadedSite = await loadValidatedSite(contentPath);
      const watchablePaths = collectWatchableLocalImagePaths(loadedSite, contentPath);

      expect(watchablePaths).toEqual([imagePath]);
    } finally {
      await removeDirectory(rootDir);
    }
  });

});
