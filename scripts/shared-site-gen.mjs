import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import chokidar from "chokidar";

const generatorDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = process.cwd();
const mainSiteContentPath = path.join(repoRoot, "content", "site.json");
const composedDistDir = path.join(repoRoot, "dist");
const tsxCliPath = path.join(generatorDir, "node_modules", "tsx", "dist", "cli.mjs");

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

const runGeneratorEntryPoint = (entryPoint, args, inheritedOptions) => {
  const entryPath = path.join(generatorDir, "src", "build", `${entryPoint}.ts`);
  runInherited(process.execPath, [tsxCliPath, entryPath, ...args], repoRoot, inheritedOptions);
};

const validateSite = (contentPath = mainSiteContentPath, inheritedOptions) => {
  runGeneratorEntryPoint("validate", [contentPath], inheritedOptions);
};

const discoverPageImages = (args, inheritedOptions) => {
  runGeneratorEntryPoint("discover-page-images", args, inheritedOptions);
};

const lighthouseCi = (inheritedOptions) => {
  runGeneratorEntryPoint("lighthouse-ci", [], inheritedOptions);
};

const localizeLandingImage = (args, inheritedOptions) => {
  runGeneratorEntryPoint("localize-landing-image", args, inheritedOptions);
};

const buildSite = (
  contentPath = mainSiteContentPath,
  outDir = composedDistDir,
  inheritedOptions,
) => {
  validateSite(contentPath, inheritedOptions);
  runGeneratorEntryPoint("build", [contentPath, outDir], inheritedOptions);
};

const watchSiteBuild = async ({ skipInitialBuild = false } = {}) => {
  const watchRoots = [
    path.join(repoRoot, "content"),
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
      buildSite(mainSiteContentPath, composedDistDir, { exitOnError: false });
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
      const relativePath = path.relative(repoRoot, changedPath);
      console.log(`Detected change in ${relativePath}. Rebuilding site...`);
      queueBuild();
    });

    watchers.push(watcher);
  }

  console.log(
    `Watching ${watchRoots.map((root) => path.relative(repoRoot, root)).join(", ")} for changes...`,
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
      console.log(`Validating with shared generator at ${generatorDir}.`);
      validateSite();
      process.exit(0);
    }

    if (command === "build:site") {
      console.log(`Building with shared generator at ${generatorDir}.`);
      if (watchMode) {
        await watchSiteBuild({ skipInitialBuild });
      } else {
        buildSite();
      }
      process.exit(0);
    }

    if (command === "dev:prepare") {
      console.log(`Preparing local dev build with shared generator at ${generatorDir}.`);
      buildSite();
      process.exit(0);
    }

    if (command === "discover:images") {
      console.log(`Discovering page images with shared generator at ${generatorDir}.`);
      discoverPageImages(commandArgs);
      process.exit(0);
    }

    if (command === "lighthouse:ci") {
      console.log(`Running Lighthouse CI with shared generator at ${generatorDir}.`);
      lighthouseCi();
      process.exit(0);
    }

    if (command === "localize:landing-image") {
      console.log(`Localizing landing image with shared generator at ${generatorDir}.`);
      localizeLandingImage(commandArgs);
      process.exit(0);
    }

    throw new Error(
      "Usage: node scripts/shared-site-gen.mjs <validate|build:site|dev:prepare|discover:images|lighthouse:ci|localize:landing-image>",
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
