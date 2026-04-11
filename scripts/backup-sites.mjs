import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import {
  buildBackupPlan,
  cleanupTemporaryDirectory,
  createArchiveFromDirectory,
  createR2Client,
  createTemporaryZipPath,
  loadDeployConfig,
  loadOptionalEnvFile,
  parseCliOptions,
  resolveR2ConfigFromEnv,
  selectSites,
  toSafeTimestamp,
} from "./deploy-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const runBackupSites = async (rawArgv = process.argv.slice(2)) => {
  await loadOptionalEnvFile(repoRoot);
  const options = parseCliOptions(rawArgv);
  const config = await loadDeployConfig(path.resolve(repoRoot, options.configPath));
  const selectedSites = selectSites(config, options.slug);
  const timestamp = toSafeTimestamp(options.timestamp);
  const summaries = [];
  const r2Config = options.dryRun ? null : resolveR2ConfigFromEnv();
  const client = r2Config ? createR2Client(r2Config) : null;

  for (const site of selectedSites) {
    const plan = await buildBackupPlan(config, site, timestamp);

    if (options.dryRun) {
      console.log(
        `[deploy:backup] ${site.slug}: would archive ${plan.includedFiles.length} files from ${site.sitePath}`,
      );
      console.log(`[deploy:backup] ${site.slug}: backup key ${plan.objectKey}`);
      summaries.push({
        slug: site.slug,
        fileCount: plan.includedFiles.length,
        bytes: 0,
      });
      continue;
    }

    const { tempDirectory, zipPath } = await createTemporaryZipPath(site.slug, timestamp);

    try {
      await createArchiveFromDirectory({
        sourceDirectory: site.sitePath,
        outputPath: zipPath,
      });

      const archiveStats = await stat(zipPath);
      await client.send(
        new PutObjectCommand({
          Bucket: r2Config.backupBucket,
          Key: plan.objectKey,
          Body: createReadStream(zipPath),
          ContentType: "application/zip",
          CacheControl: "no-cache",
        }),
      );

      console.log(
        `[deploy:backup] ${site.slug}: uploaded ${plan.objectKey} (${archiveStats.size} bytes)`,
      );
      summaries.push({
        slug: site.slug,
        fileCount: plan.includedFiles.length,
        bytes: archiveStats.size,
      });
    } finally {
      await cleanupTemporaryDirectory(tempDirectory);
    }
  }

  return {
    timestamp,
    siteCount: summaries.length,
    summaries,
  };
};

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    const result = await runBackupSites();
    console.log(
      `[deploy:backup] completed ${result.siteCount} site(s) at ${result.timestamp}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
