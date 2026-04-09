import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

  it("copies local content images and rewrites page HTML to reference them relatively", async () => {
    const fixture = await createLocalImageProject(1800, 1200);
    const outDir = path.join(fixture.rootDir, "dist");

    try {
      await buildSiteFromFile(fixture.contentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const portfolioHtml = await readFile(path.join(outDir, "portfolio", "index.html"), "utf8");
      const copiedImagePath = path.join(outDir, "images", "showroom.png");

      expect((await readFile(copiedImagePath)).equals(await readFile(fixture.imagePath))).toBe(true);
      expect(homeHtml).toContain('src="images/showroom.png"');
      expect(homeHtml).toContain('data-gallery-full-src="images/showroom.png"');
      expect(portfolioHtml).toContain('src="../images/showroom.png"');
      expect(portfolioHtml).toContain('data-gallery-full-src="../images/showroom.png"');
      await expect(readdir(path.join(outDir, "assets", "images"))).rejects.toThrow();
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
});
