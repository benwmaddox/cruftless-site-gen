import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildPublishPlan,
  createPublishManifest,
  createR2Client,
  deleteObjectKeys,
  listAllObjectKeys,
  loadDeployConfig,
  loadOptionalEnvFile,
  parseCliOptions,
  resolveR2ConfigFromEnv,
  selectSites,
  toSafeTimestamp,
  uploadFile,
  uploadText,
} from "./deploy-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const runPublishSites = async (rawArgv = process.argv.slice(2)) => {
  await loadOptionalEnvFile(repoRoot);
  const options = parseCliOptions(rawArgv);
  const config = await loadDeployConfig(path.resolve(repoRoot, options.configPath));
  const selectedSites = selectSites(config, options.slug);
  const timestamp = toSafeTimestamp(options.timestamp);
  const summaries = [];
  const r2Config = options.dryRun ? null : resolveR2ConfigFromEnv();
  const client = r2Config ? createR2Client(r2Config) : null;

  for (const site of selectedSites) {
    const plan = await buildPublishPlan(config, site);
    const sitePrefix = `${config.cloudflare.livePrefix}/${site.slug}/`;
    let staleKeys = [];

    if (options.dryRun) {
      console.log(
        `[deploy:publish] ${site.slug}: would upload ${plan.uploads.length} files from ${plan.publishDirectory}`,
      );
      console.log(
        `[deploy:publish] ${site.slug}: sample key ${plan.uploads[0].objectKey}`,
      );
    } else {
      if (options.prune) {
        const existingKeys = await listAllObjectKeys(client, r2Config.liveBucket, sitePrefix);
        const activeKeys = new Set(plan.uploads.map((upload) => upload.objectKey));
        activeKeys.add(`${sitePrefix}deploy-manifest.json`);
        staleKeys = existingKeys.filter((key) => !activeKeys.has(key));
      }

      if (staleKeys.length > 0) {
        await deleteObjectKeys(client, r2Config.liveBucket, staleKeys);
      }

      for (const upload of plan.uploads) {
        await uploadFile({
          client,
          bucket: r2Config.liveBucket,
          key: upload.objectKey,
          filePath: upload.absolutePath,
          contentType: upload.contentType,
          cacheControl: upload.cacheControl,
        });
      }

      await uploadText({
        client,
        bucket: r2Config.liveBucket,
        key: `${sitePrefix}deploy-manifest.json`,
        body: createPublishManifest({
          config,
          site,
          timestamp,
          uploads: plan.uploads,
        }),
        contentType: "application/json; charset=utf-8",
        cacheControl: "no-cache",
      });

      console.log(
        `[deploy:publish] ${site.slug}: uploaded ${plan.uploads.length} files to ${r2Config.liveBucket}/${sitePrefix}`,
      );
      if (options.prune) {
        console.log(`[deploy:publish] ${site.slug}: pruned ${staleKeys.length} stale objects`);
      }
    }

    summaries.push({
      slug: site.slug,
      uploadCount: plan.uploads.length,
      staleCount: staleKeys.length,
    });
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
    const result = await runPublishSites();
    console.log(
      `[deploy:publish] completed ${result.siteCount} site(s) at ${result.timestamp}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      process.exit(1);
    }

    throw error;
  }
}
