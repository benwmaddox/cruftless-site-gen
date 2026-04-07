import { readFile } from "node:fs/promises";
import { watchFile, unwatchFile } from "node:fs";
import path from "node:path";

import { SiteContentSchema } from "../schemas/site.schema.js";
import {
  buildSite,
  ValidationFailure,
  defaultContentPath,
  defaultOutDir,
  loadValidatedSite,
} from "./framework.js";
import { collectWatchableLocalImagePaths } from "./image-pipeline.js";

const args = process.argv.slice(2);
const watchMode = args.includes("--watch") || args.includes("-w");
const positionalArgs = args.filter((arg) => arg !== "--watch" && arg !== "-w");

if (positionalArgs.length > 2) {
  throw new Error("Usage: tsx src/build/build.ts [content-path] [out-dir] [--watch]");
}

const [contentArg, outArg] = positionalArgs;
const contentPath = contentArg ? path.resolve(process.cwd(), contentArg) : defaultContentPath;
const outDir = outArg ? path.resolve(process.cwd(), outArg) : defaultOutDir;
const relativeContentPath = path.relative(process.cwd(), contentPath);

const formatBuildSummary = (pageCount: number, outDirectory: string, changedFiles: number): string => {
  const relativeOutDir = path.relative(process.cwd(), outDirectory) || ".";
  const fileLabel = changedFiles === 1 ? "1 file changed" : `${changedFiles} files changed`;
  return `Built ${pageCount} page(s) into ${relativeOutDir} (${fileLabel})`;
};

const loadWatchableImagePaths = async (): Promise<string[]> => {
  try {
    const rawJson = await readFile(contentPath, "utf8");
    const rawData = JSON.parse(rawJson) as unknown;
    const parsed = SiteContentSchema.safeParse(rawData);

    if (!parsed.success) {
      return [];
    }

    return collectWatchableLocalImagePaths(parsed.data, contentPath);
  } catch {
    return [];
  }
};

const runBuild = async (): Promise<boolean> => {
  try {
    const siteContent = await loadValidatedSite(contentPath);
    const buildResult = await buildSite(siteContent, outDir, { contentPath });
    const changedFiles =
      buildResult.filesCreated + buildResult.filesUpdated + buildResult.filesRemoved;

    console.log(formatBuildSummary(siteContent.pages.length, outDir, changedFiles));
    return true;
  } catch (error) {
    if (error instanceof ValidationFailure) {
      console.error(error.message);
      return false;
    }

    throw error;
  }
};

try {
  const initialBuildSucceeded = await runBuild();

  if (!watchMode) {
    process.exitCode = initialBuildSucceeded ? 0 : 1;
  } else {
    let buildInProgress = false;
    let queuedBuild = false;
    let watchedImagePaths = new Set<string>();

    const watchPath = (filePath: string) => {
      watchFile(filePath, { interval: 250 }, (current, previous) => {
        if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
          return;
        }

        triggerBuild(filePath);
      });
    };

    const syncWatchedImagePaths = async () => {
      const nextPaths = new Set(await loadWatchableImagePaths());

      watchedImagePaths.forEach((filePath) => {
        if (!nextPaths.has(filePath)) {
          unwatchFile(filePath);
        }
      });

      nextPaths.forEach((filePath) => {
        if (!watchedImagePaths.has(filePath)) {
          watchPath(filePath);
        }
      });

      watchedImagePaths = nextPaths;
    };

    const triggerBuild = (changedPath: string = contentPath) => {
      if (buildInProgress) {
        queuedBuild = true;
        return;
      }

      buildInProgress = true;
      void (async () => {
        try {
          console.log(`Change detected in ${path.relative(process.cwd(), changedPath)}. Rebuilding...`);
          const buildSucceeded = await runBuild();
          await syncWatchedImagePaths();
          process.exitCode = buildSucceeded ? 0 : 1;
        } finally {
          buildInProgress = false;

          if (queuedBuild) {
            queuedBuild = false;
            triggerBuild(changedPath);
          }
        }
      })();
    };

    watchFile(contentPath, { interval: 250 }, (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
        return;
      }

      triggerBuild(contentPath);
    });

    const stopWatching = () => {
      unwatchFile(contentPath);
      watchedImagePaths.forEach((filePath) => {
        unwatchFile(filePath);
      });
      process.exit();
    };

    process.on("SIGINT", stopWatching);
    process.on("SIGTERM", stopWatching);

    await syncWatchedImagePaths();
    console.log(`Watching ${relativeContentPath} for changes...`);
  }
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
