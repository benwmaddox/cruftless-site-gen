import { watchFile, unwatchFile } from "node:fs";
import path from "node:path";

import {
  buildSite,
  ValidationFailure,
  defaultContentPath,
  defaultOutDir,
  loadValidatedSite,
} from "./framework.js";

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

const runBuild = async (): Promise<boolean> => {
  try {
    const siteContent = await loadValidatedSite(contentPath);
    const buildResult = await buildSite(siteContent, outDir, contentPath);
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

    const triggerBuild = () => {
      if (buildInProgress) {
        queuedBuild = true;
        return;
      }

      buildInProgress = true;
      void (async () => {
        try {
          console.log(`Change detected in ${relativeContentPath}. Rebuilding...`);
          await runBuild();
        } finally {
          buildInProgress = false;

          if (queuedBuild) {
            queuedBuild = false;
            triggerBuild();
          }
        }
      })();
    };

    watchFile(contentPath, { interval: 250 }, (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) {
        return;
      }

      triggerBuild();
    });

    const stopWatching = () => {
      unwatchFile(contentPath);
      process.exit();
    };

    process.on("SIGINT", stopWatching);
    process.on("SIGTERM", stopWatching);

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
