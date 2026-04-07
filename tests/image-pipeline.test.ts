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
      await rm(fixture.rootDir, { recursive: true, force: true });
    }
  });

  it("generates stable local image variants and rewrites page HTML to reference them", async () => {
    const fixture = await createLocalImageProject(1800, 1200);
    const outDir = path.join(fixture.rootDir, "dist");

    try {
      await buildSiteFromFile(fixture.contentPath, outDir);

      const homeHtml = await readFile(path.join(outDir, "index.html"), "utf8");
      const portfolioHtml = await readFile(path.join(outDir, "portfolio", "index.html"), "utf8");
      const imageFileNames = await readdir(path.join(outDir, "assets", "images"));

      expect(homeHtml).toContain('src="assets/images/showroom-gallery-thumb-3-');
      expect(homeHtml).toContain('data-gallery-full-src="assets/images/showroom-gallery-full-');
      expect(homeHtml).toContain('src="assets/images/showroom-media-content-');
      expect(portfolioHtml).toContain('src="../assets/images/showroom-gallery-thumb-3-');
      expect(portfolioHtml).toContain(
        'data-gallery-full-src="../assets/images/showroom-gallery-full-',
      );

      expect(imageFileNames.filter((fileName) => fileName.includes("gallery-thumb-3"))).toHaveLength(
        1,
      );
      expect(imageFileNames.filter((fileName) => fileName.includes("gallery-full"))).toHaveLength(1);
      expect(imageFileNames.filter((fileName) => fileName.includes("media-content"))).toHaveLength(
        1,
      );

      const galleryThumbMetadata = await sharp(
        path.join(
          outDir,
          "assets",
          "images",
          imageFileNames.find((fileName) => fileName.includes("gallery-thumb-3")) ?? "",
        ),
      ).metadata();
      const galleryFullMetadata = await sharp(
        path.join(
          outDir,
          "assets",
          "images",
          imageFileNames.find((fileName) => fileName.includes("gallery-full")) ?? "",
        ),
      ).metadata();
      const mediaMetadata = await sharp(
        path.join(
          outDir,
          "assets",
          "images",
          imageFileNames.find((fileName) => fileName.includes("media-content")) ?? "",
        ),
      ).metadata();

      expect(galleryThumbMetadata.width).toBe(560);
      expect(galleryFullMetadata.width).toBe(1800);
      expect(mediaMetadata.width).toBe(1280);
    } finally {
      await rm(fixture.rootDir, { recursive: true, force: true });
    }
  });

  it("collects unique local image dependencies for watch mode", async () => {
    const fixture = await createLocalImageProject(1800, 1200);

    try {
      const siteContent = await loadValidatedSite(fixture.contentPath);
      const watchablePaths = collectWatchableLocalImagePaths(siteContent, fixture.contentPath);

      expect(watchablePaths).toEqual([fixture.imagePath]);
    } finally {
      await rm(fixture.rootDir, { recursive: true, force: true });
    }
  });
});
