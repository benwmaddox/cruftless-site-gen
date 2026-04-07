import { spawn, type ChildProcessByStdio } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { SiteContentSchema } from "../src/schemas/site.schema.js";

const repoRoot = path.resolve(process.cwd());

interface WatchFixture {
  contentPath: string;
  imagePath: string;
  outDir: string;
  rootDir: string;
}

const createLocalImage = async (
  filePath: string,
  width: number,
  height: number,
  color: string,
): Promise<void> => {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toFile(filePath);
};

const createWatchFixture = async (): Promise<WatchFixture> => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-image-watch-"));
  const contentDir = path.join(rootDir, "content");
  const imageDir = path.join(contentDir, "images");
  const imagePath = path.join(imageDir, "showroom.png");
  const contentPath = path.join(contentDir, "site.json");
  const outDir = path.join(rootDir, "dist");

  await mkdir(imageDir, { recursive: true });
  await createLocalImage(imagePath, 1800, 1200, "#7a8f74");

  const siteContent = SiteContentSchema.parse({
    site: {
      name: "Watch Check",
      baseUrl: "https://watch-check.example",
      theme: "friendly-modern",
    },
    pages: [
      {
        slug: "/",
        title: "Home",
        components: [
          {
            type: "gallery",
            title: "Gallery",
            columns: "3",
            images: [
              {
                src: "images/showroom.png",
                alt: "Main showroom view",
                caption: "Initial caption",
              },
              {
                src: "images/showroom.png",
                alt: "Showroom detail",
                caption: "Initial detail",
              },
            ],
          },
          {
            type: "media",
            src: "images/showroom.png",
            alt: "Media view",
            size: "content",
            caption: "Initial media caption",
          },
        ],
      },
    ],
  });

  await writeFile(contentPath, JSON.stringify(siteContent, null, 2));

  return {
    contentPath,
    imagePath,
    outDir,
    rootDir,
  };
};

const waitFor = async (
  predicate: () => Promise<boolean>,
  timeoutMs: number,
  stepMs: number = 100,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await predicate()) {
      return;
    }

    await delay(stepMs);
  }

  throw new Error(`Timed out after ${timeoutMs}ms`);
};

const readImageVariantSnapshot = async (
  imagesDir: string,
): Promise<Array<{ mtimeMs: number; name: string }>> => {
  const fileNames = (await readdir(imagesDir)).sort();

  return Promise.all(
    fileNames.map(async (fileName) => {
      const fileStats = await stat(path.join(imagesDir, fileName));
      return {
        mtimeMs: fileStats.mtimeMs,
        name: fileName,
      };
    }),
  );
};

const spawnWatchBuild = (
  contentPath: string,
  outDir: string,
): {
  process: ChildProcessByStdio<null, Readable, Readable>;
  stderr: () => string;
  stdout: () => string;
} => {
  const childProcess = spawn(
    process.execPath,
    ["./node_modules/tsx/dist/cli.mjs", "src/build/build.ts", contentPath, outDir, "--watch"],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";

  childProcess.stdout.setEncoding("utf8");
  childProcess.stderr.setEncoding("utf8");
  childProcess.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  childProcess.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  return {
    process: childProcess,
    stderr: () => stderr,
    stdout: () => stdout,
  };
};

describe("build watch mode", () => {
  it(
    "rebuilds on watched image changes without regenerating variants for caption-only JSON edits",
    async () => {
      const fixture = await createWatchFixture();
      const { process: watchProcess, stderr, stdout } = spawnWatchBuild(
        fixture.contentPath,
        fixture.outDir,
      );

      try {
        await waitFor(async () => {
          try {
            await access(path.join(fixture.outDir, "index.html"));
            return stdout().includes("Watching ");
          } catch {
            return false;
          }
        }, 20_000);

        const imagesDir = path.join(fixture.outDir, "assets", "images");
        const beforeJsonEdit = await readImageVariantSnapshot(imagesDir);

        const siteContent = JSON.parse(await readFile(fixture.contentPath, "utf8")) as {
          pages: Array<{ components: Array<Record<string, unknown>> }>;
        };
        (siteContent.pages[0]?.components[0] as { images: Array<{ caption: string }> }).images[0].caption =
          "Updated caption only";
        (siteContent.pages[0]?.components[1] as { caption: string }).caption =
          "Updated media caption only";
        await writeFile(fixture.contentPath, JSON.stringify(siteContent, null, 2));

        await waitFor(async () => {
          const html = await readFile(path.join(fixture.outDir, "index.html"), "utf8");
          return (
            stdout().includes(path.basename(fixture.contentPath)) && html.includes("Updated caption only")
          );
        }, 20_000);

        const afterJsonEdit = await readImageVariantSnapshot(imagesDir);

        expect(afterJsonEdit).toEqual(beforeJsonEdit);

        await delay(1_100);
        await createLocalImage(fixture.imagePath, 1500, 1000, "#4f6d8a");

        await waitFor(async () => {
          const afterImageEdit = await readImageVariantSnapshot(imagesDir);
          return afterImageEdit.some(
            (file, index) => file.name !== beforeJsonEdit[index]?.name,
          );
        }, 20_000);

        const afterImageEdit = await readImageVariantSnapshot(imagesDir);
        expect(afterImageEdit.map((file) => file.name)).not.toEqual(
          afterJsonEdit.map((file) => file.name),
        );
        expect(stdout()).toContain(path.basename(fixture.imagePath));
        expect(stderr()).toBe("");
      } finally {
        watchProcess.kill("SIGTERM");
        await Promise.race([
          new Promise<void>((resolve) => {
            watchProcess.once("exit", () => resolve());
          }),
          delay(2_000).then(() => {
            if (!watchProcess.killed) {
              watchProcess.kill("SIGKILL");
            }
          }),
        ]);
        await rm(fixture.rootDir, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
