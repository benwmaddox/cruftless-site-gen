import { pathToFileURL } from "node:url";

import { parseCliOptions, toSafeTimestamp } from "./deploy-lib.mjs";
import { runBackupSites } from "./backup-sites.mjs";
import { runPublishSites } from "./publish-sites.mjs";

export const runDeployAll = async (rawArgv = process.argv.slice(2)) => {
  const options = parseCliOptions(rawArgv);
  const timestamp = toSafeTimestamp(options.timestamp);
  const forwardArgs = ["--config", options.configPath, "--timestamp", timestamp];

  if (options.slug) {
    forwardArgs.push("--slug", options.slug);
  }

  if (options.dryRun) {
    forwardArgs.push("--dry-run");
  }

  if (!options.prune) {
    forwardArgs.push("--no-prune");
  }

  const publishSummary = await runPublishSites(forwardArgs);
  const backupSummary = await runBackupSites(forwardArgs);

  return {
    timestamp,
    publishSummary,
    backupSummary,
  };
};

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    const result = await runDeployAll();
    console.log(
      `[deploy:sites] published ${result.publishSummary.siteCount} site(s) and backed up ${result.backupSummary.siteCount} site(s) at ${result.timestamp}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
