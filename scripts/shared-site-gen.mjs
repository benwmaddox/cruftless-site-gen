#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import chokidar from "chokidar";

const generatorDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsxCliPath = path.join(generatorDir, "node_modules", "tsx", "dist", "cli.mjs");

const resolveSitePaths = (siteDir = ".") => {
  const root = path.resolve(process.cwd(), siteDir);

  return {
    root,
    contentPath: path.join(root, "content", "site.json"),
    distDir: path.join(root, "dist"),
  };
};

const parseSiteCommandArgs = (args) => {
  let siteDir = ".";
  let siteDirWasSet = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--site-dir" || arg === "--site") {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Missing path after ${arg}`);
      }

      siteDir = value;
      siteDirWasSet = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--site-dir=")) {
      siteDir = arg.slice("--site-dir=".length);
      if (!siteDir) {
        throw new Error("Missing path after --site-dir");
      }

      siteDirWasSet = true;
      continue;
    }

    if (arg.startsWith("--site=")) {
      siteDir = arg.slice("--site=".length);
      if (!siteDir) {
        throw new Error("Missing path after --site");
      }

      siteDirWasSet = true;
      continue;
    }

    if (!siteDirWasSet && !arg.startsWith("-")) {
      siteDir = arg;
      siteDirWasSet = true;
      continue;
    }
  }

  return {
    sitePaths: resolveSitePaths(siteDir),
  };
};

const runInherited = (command, args, cwd, { exitOnError = true } = {}) => {
  const [spawnCommand, spawnArgs] =
    process.platform === "win32" && command === "npm"
      ? [process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", command, ...args]]
      : [command, args];

  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    if (exitOnError) {
      process.exit(result.status);
    }

    throw new Error(
      `Command failed with exit code ${result.status}: ${command} ${args.join(" ")}`,
    );
  }
};

const ensureGeneratorDependenciesAvailable = () => {
  if (!existsSync(tsxCliPath)) {
    throw new Error(
      `Shared generator dependencies are missing in ${generatorDir}. Run npm install there first.`,
    );
  }
};

const runGeneratorEntryPoint = (entryPoint, args, cwd, inheritedOptions) => {
  const entryPath = path.join(generatorDir, "src", "build", `${entryPoint}.ts`);
  runInherited(process.execPath, [tsxCliPath, entryPath, ...args], cwd, inheritedOptions);
};

const validateSite = (sitePaths, contentPath = sitePaths.contentPath, inheritedOptions) => {
  runGeneratorEntryPoint("validate", [contentPath], sitePaths.root, inheritedOptions);
};

const discoverPageImages = (args, inheritedOptions) => {
  runGeneratorEntryPoint("discover-page-images", args, process.cwd(), inheritedOptions);
};

const lighthouseCi = (sitePaths, inheritedOptions) => {
  runGeneratorEntryPoint("lighthouse-ci", [], sitePaths.root, inheritedOptions);
};

const localizeLandingImage = (args, inheritedOptions) => {
  runGeneratorEntryPoint("localize-landing-image", args, process.cwd(), inheritedOptions);
};

const buildSite = (
  sitePaths,
  contentPath = sitePaths.contentPath,
  outDir = sitePaths.distDir,
  inheritedOptions,
) => {
  validateSite(sitePaths, contentPath, inheritedOptions);
  runGeneratorEntryPoint("build", [contentPath, outDir], sitePaths.root, inheritedOptions);
};

const watchSiteBuild = async (sitePaths, { skipInitialBuild = false } = {}) => {
  const watchRoots = [
    path.join(sitePaths.root, "content"),
    path.join(generatorDir, "src"),
  ];
  const watchers = [];
  let debounceTimer;
  let buildInProgress = false;
  let queuedBuild = false;

  const runBuild = () => {
    if (buildInProgress) {
      queuedBuild = true;
      return;
    }

    buildInProgress = true;

    try {
      buildSite(sitePaths, sitePaths.contentPath, sitePaths.distDir, { exitOnError: false });
      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        process.exitCode = 1;
      } else {
        throw error;
      }
    } finally {
      buildInProgress = false;

      if (queuedBuild) {
        queuedBuild = false;
        queueBuild();
      }
    }
  };

  const queueBuild = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      runBuild();
    }, 100);
  };

  for (const root of watchRoots) {
    const watcher = chokidar.watch(root, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50,
      },
    });

    watcher.on("all", (_eventName, changedPath) => {
      const relativePath = path.relative(sitePaths.root, changedPath);
      console.log(`Detected change in ${relativePath}. Rebuilding site...`);
      queueBuild();
    });

    watchers.push(watcher);
  }

  console.log(
    `Watching ${watchRoots.map((root) => path.relative(sitePaths.root, root)).join(", ")} for changes...`,
  );

  if (!skipInitialBuild) {
    runBuild();
  }

  const stopWatching = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    for (const watcher of watchers) {
      void watcher.close();
    }
  };

  process.once("SIGINT", () => {
    stopWatching();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    stopWatching();
    process.exit(0);
  });

  await new Promise(() => {});
};

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const command = process.argv[2];
  const commandArgs = process.argv.slice(3);
  const watchMode = commandArgs.includes("--watch") || commandArgs.includes("-w");
  const skipInitialBuild = commandArgs.includes("--skip-initial");

  try {
    ensureGeneratorDependenciesAvailable();

    if (command === "validate") {
      const { sitePaths } = parseSiteCommandArgs(commandArgs);
      console.log(
        `Validating ${path.relative(process.cwd(), sitePaths.root) || "."} with shared generator at ${generatorDir}.`,
      );
      validateSite(sitePaths);
      process.exit(0);
    }

    if (command === "build" || command === "build:site") {
      const { sitePaths } = parseSiteCommandArgs(commandArgs);
      console.log(
        `Building ${path.relative(process.cwd(), sitePaths.root) || "."} with shared generator at ${generatorDir}.`,
      );
      if (watchMode) {
        await watchSiteBuild(sitePaths, { skipInitialBuild });
      } else {
        buildSite(sitePaths);
      }
      process.exit(0);
    }

    if (command === "dev:prepare" || command === "prepare") {
      const { sitePaths } = parseSiteCommandArgs(commandArgs);
      console.log(
        `Preparing ${path.relative(process.cwd(), sitePaths.root) || "."} with shared generator at ${generatorDir}.`,
      );
      buildSite(sitePaths);
      process.exit(0);
    }

    if (command === "discover:images") {
      console.log(`Discovering page images with shared generator at ${generatorDir}.`);
      discoverPageImages(commandArgs);
      process.exit(0);
    }

    if (command === "lighthouse:ci") {
      const { sitePaths } = parseSiteCommandArgs(commandArgs);
      console.log(
        `Running Lighthouse CI for ${path.relative(process.cwd(), sitePaths.root) || "."} with shared generator at ${generatorDir}.`,
      );
      lighthouseCi(sitePaths);
      process.exit(0);
    }

    if (command === "localize:landing-image") {
      console.log(`Localizing landing image with shared generator at ${generatorDir}.`);
      localizeLandingImage(commandArgs);
      process.exit(0);
    }

    throw new Error(
      "Usage: cruftless-site-gen <validate|build|build:site|prepare|dev:prepare|discover:images|lighthouse:ci|localize:landing-image> [site-dir]",
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
