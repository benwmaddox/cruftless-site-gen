import path from "node:path";

import chokidar from "chokidar";

import { themeNames } from "../themes/index.js";
import {
  ValidationFailure,
  buildThemeExamples,
  examplesOutDir,
  examplesContentDir,
} from "./theme-example-previews.js";

const args = process.argv.slice(2);
const watchMode = args.includes("--watch") || args.includes("-w");
const unsupportedArgs = args.filter((arg) => arg !== "--watch" && arg !== "-w");

if (unsupportedArgs.length > 0) {
  throw new Error("Usage: tsx src/build/build-examples.ts [--watch]");
}

const formatBuildSummary = (builtPages: number, previewCount: number): string =>
  `Built the theme preview index plus ${themeNames.length} theme example site(s) with ${builtPages} page(s) and ${previewCount} real screenshot preview(s) into ${path.relative(process.cwd(), examplesOutDir)}`;

const runBuild = async (): Promise<boolean> => {
  try {
    const { builtPages, previewCount } = await buildThemeExamples();

    console.log(formatBuildSummary(builtPages, previewCount));
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
    let queuedChangedPath = "";
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const watchRoots = [
      examplesContentDir,
      path.resolve(process.cwd(), "src/build"),
      path.resolve(process.cwd(), "src/components"),
      path.resolve(process.cwd(), "src/layout"),
      path.resolve(process.cwd(), "src/renderer"),
      path.resolve(process.cwd(), "src/schemas"),
      path.resolve(process.cwd(), "src/styles"),
      path.resolve(process.cwd(), "src/themes"),
      path.resolve(process.cwd(), "src/validation"),
    ];

    const runQueuedBuild = (changedPath: string) => {
      if (buildInProgress) {
        queuedBuild = true;
        queuedChangedPath = changedPath;
        return;
      }

      buildInProgress = true;
      void (async () => {
        try {
          console.log(
            `Change detected in ${path.relative(process.cwd(), changedPath)}. Rebuilding examples...`,
          );
          const buildSucceeded = await runBuild();
          process.exitCode = buildSucceeded ? 0 : 1;
        } finally {
          buildInProgress = false;

          if (queuedBuild) {
            const nextChangedPath = queuedChangedPath || changedPath;
            queuedBuild = false;
            queuedChangedPath = "";
            runQueuedBuild(nextChangedPath);
          }
        }
      })();
    };

    const triggerBuild = (changedPath: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        runQueuedBuild(changedPath);
      }, 100);
    };

    const watcher = chokidar.watch(watchRoots, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    watcher.on("all", (_eventName, changedPath) => {
      triggerBuild(changedPath);
    });

    watcher.on("error", (error) => {
      console.error(error);
      process.exitCode = 1;
    });

    const stopWatching = () => {
      void watcher.close().finally(() => {
        process.exit();
      });
    };

    process.on("SIGINT", stopWatching);
    process.on("SIGTERM", stopWatching);

    console.log(
      `Watching ${watchRoots.map((root) => path.relative(process.cwd(), root)).join(", ")} for changes...`,
    );
  }
} catch (error) {
  if (error instanceof ValidationFailure) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
