import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { optimizeContentImages } from "../src/build/optimize-content-images.js";

const createNoisyPngBytes = (width: number, height: number): Promise<Buffer> => {
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);
  let seed = 123456789;

  for (let index = 0; index < data.length; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    data[index] = seed & 0xff;
  }

  return sharp(data, {
    raw: {
      channels,
      width,
      height,
    },
  })
    .png()
    .toBuffer();
};

describe("optimizeContentImages", () => {
  it("converts referenced generated PNGs to WebP and rewrites content references", async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-optimize-"));
    const contentDir = path.join(siteDir, "content");
    const imagesDir = path.join(contentDir, "images");
    const contentPath = path.join(contentDir, "site.json");
    const pngPath = path.join(imagesDir, "generated-hero.png");
    const webpPath = path.join(imagesDir, "generated-hero.webp");

    await mkdir(imagesDir, { recursive: true });
    await writeFile(pngPath, await createNoisyPngBytes(480, 320));
    await writeFile(
      contentPath,
      JSON.stringify(
        {
          site: {
            image: "/content/images/generated-hero.png",
          },
          pages: [
            {
              image: {
                src: "/content/images/generated-hero.png",
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = await optimizeContentImages({
      contentPath,
      minSavingsRatio: -100,
      quality: 82,
    });
    const optimizedStat = await stat(webpPath);
    const siteJson = await readFile(contentPath, "utf8");

    expect(result.optimized).toHaveLength(1);
    expect(result.optimized[0]?.referenceCount).toBe(2);
    expect(result.siteJsonUpdated).toBe(true);
    expect(optimizedStat.size).toBe(result.optimized[0]?.optimizedBytes);
    expect(siteJson).toContain("/content/images/generated-hero.webp");
    expect(siteJson).not.toContain("/content/images/generated-hero.png");
    await expect(stat(pngPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not write files during a dry run", async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-optimize-dry-"));
    const contentDir = path.join(siteDir, "content");
    const imagesDir = path.join(contentDir, "images");
    const contentPath = path.join(contentDir, "site.json");
    const pngPath = path.join(imagesDir, "generated-hero.png");
    const webpPath = path.join(imagesDir, "generated-hero.webp");

    await mkdir(imagesDir, { recursive: true });
    await writeFile(pngPath, await createNoisyPngBytes(480, 320));
    await writeFile(
      contentPath,
      JSON.stringify({ image: "/content/images/generated-hero.png" }, null, 2),
      "utf8",
    );

    const result = await optimizeContentImages({
      contentPath,
      dryRun: true,
      minSavingsRatio: -100,
      quality: 82,
    });
    const siteJson = await readFile(contentPath, "utf8");

    expect(result.optimized).toHaveLength(1);
    expect(result.siteJsonUpdated).toBe(true);
    expect(siteJson).toContain("/content/images/generated-hero.png");
    await expect(stat(pngPath)).resolves.toBeDefined();
    await expect(stat(webpPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does nothing when the site has no images directory", async () => {
    const siteDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-optimize-empty-"));
    const contentDir = path.join(siteDir, "content");
    const contentPath = path.join(contentDir, "site.json");

    await mkdir(contentDir, { recursive: true });
    await writeFile(contentPath, JSON.stringify({ image: "/content/images/generated-hero.png" }), "utf8");

    const result = await optimizeContentImages({ contentPath });

    expect(result).toEqual({
      optimized: [],
      skipped: [],
      siteJsonUpdated: false,
    });
  });
});
