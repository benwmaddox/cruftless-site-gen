import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import archiver from "archiver";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { lookup as lookupMimeType } from "mime-types";

export const DNS_SAFE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const DEFAULT_DEPLOY_CONFIG = {
  cloudflare: {
    domainSuffix: "sitebyemail.com",
    livePrefix: "live",
    backupPrefix: "backups",
  },
};

export const toPosixPath = (value) => value.split(path.sep).join("/");

/** @param {string | Date | undefined} value */
export const toSafeTimestamp = (value = new Date()) => {
  const raw = typeof value === "string" ? value : value.toISOString();
  return raw.replace(/\.\d{3}Z$/u, "Z").replace(/:/gu, "-");
};

export const isDnsSafeSlug = (value) => DNS_SAFE_SLUG_PATTERN.test(value);

export const detectContentType = (filePath) =>
  lookupMimeType(filePath) || "application/octet-stream";

export const detectCacheControl = (relativePath) => {
  if (relativePath.endsWith(".html")) {
    return "no-cache";
  }

  if (/[._-][0-9a-f]{8,}[._-]/iu.test(relativePath)) {
    return "public, max-age=31536000, immutable";
  }

  if (/\.(?:css|js|mjs|png|jpg|jpeg|webp|gif|svg|woff2?|ttf)$/iu.test(relativePath)) {
    return "public, max-age=604800";
  }

  return "public, max-age=3600";
};

export const buildLiveObjectKey = ({ livePrefix, slug, relativePath }) =>
  [livePrefix.replace(/^\/+|\/+$/gu, ""), slug, relativePath.replace(/^\/+/u, "")]
    .filter(Boolean)
    .join("/");

export const buildBackupObjectKey = ({ backupPrefix, slug, timestamp }) =>
  [backupPrefix.replace(/^\/+|\/+$/gu, ""), slug, `${timestamp}.zip`].join("/");

export const shouldExcludeFromBackup = (relativePath) => {
  const normalized = toPosixPath(relativePath);
  const segments = normalized.split("/").filter(Boolean);
  return segments.some((segment) =>
    [".git", ".wrangler", "coverage", "node_modules"].includes(segment),
  );
};

export const parseCliOptions = (argv) => {
  const options = {
    configPath: "deploy/sites.json",
    dryRun: false,
    prune: true,
    slug: undefined,
    timestamp: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--config") {
      options.configPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--slug") {
      options.slug = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--timestamp") {
      options.timestamp = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (token === "--no-prune") {
      options.prune = false;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return options;
};

export const loadOptionalEnvFile = async (repoRoot, candidates = ["deploy/.env", ".env.deploy"]) => {
  for (const candidate of candidates) {
    const fullPath = path.resolve(repoRoot, candidate);

    try {
      await access(fullPath);
    } catch {
      continue;
    }

    const content = await readFile(fullPath, "utf8");

    for (const line of content.split(/\r?\n/u)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/gu, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    return fullPath;
  }

  return null;
};

const ensureDirectoryExists = async (directoryPath, label) => {
  try {
    await access(directoryPath);
  } catch {
    throw new Error(`${label} does not exist: ${directoryPath}`);
  }
};

export const listFilesRecursive = async (rootPath, shouldExclude = () => false) => {
  const discoveredFiles = [];

  const walk = async (currentPath) => {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, absolutePath);

      if (shouldExclude(relativePath, entry)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        discoveredFiles.push(absolutePath);
      }
    }
  };

  await walk(rootPath);
  return discoveredFiles.sort((left, right) => left.localeCompare(right));
};

export const normalizeDeployConfig = (rawConfig, configPath) => {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Deploy config must be a JSON object.");
  }

  if (!Array.isArray(rawConfig.sites) || rawConfig.sites.length === 0) {
    throw new Error("Deploy config must include a non-empty sites array.");
  }

  const configDirectory = path.dirname(configPath);
  const cloudflare = {
    ...DEFAULT_DEPLOY_CONFIG.cloudflare,
    ...(rawConfig.cloudflare ?? {}),
  };

  const seenSlugs = new Set();
  const sites = rawConfig.sites.map((site, index) => {
    if (!site || typeof site !== "object") {
      throw new Error(`Site at index ${index} must be an object.`);
    }

    if (typeof site.slug !== "string" || !site.slug) {
      throw new Error(`Site at index ${index} is missing slug.`);
    }

    if (!isDnsSafeSlug(site.slug)) {
      throw new Error(`Site slug must be DNS-safe: ${site.slug}`);
    }

    if (seenSlugs.has(site.slug)) {
      throw new Error(`Duplicate site slug found in deploy config: ${site.slug}`);
    }

    seenSlugs.add(site.slug);

    if (typeof site.sitePath !== "string" || !site.sitePath) {
      throw new Error(`Site ${site.slug} is missing sitePath.`);
    }

    return {
      slug: site.slug,
      sitePath: path.resolve(configDirectory, site.sitePath),
      publishDir: site.publishDir ?? "dist",
      enabled: site.enabled !== false,
    };
  });

  return {
    configPath,
    cloudflare,
    sites,
  };
};

export const loadDeployConfig = async (configPath) => {
  const resolvedConfigPath = path.resolve(configPath);
  const rawConfig = JSON.parse(await readFile(resolvedConfigPath, "utf8"));
  return normalizeDeployConfig(rawConfig, resolvedConfigPath);
};

export const selectSites = (config, slug) => {
  const enabledSites = config.sites.filter((site) => site.enabled);

  if (!slug) {
    return enabledSites;
  }

  const selectedSites = enabledSites.filter((site) => site.slug === slug);

  if (selectedSites.length === 0) {
    throw new Error(`No enabled site matches slug "${slug}".`);
  }

  return selectedSites;
};

export const resolvePublishDirectory = async (site) => {
  const publishDirectory = path.resolve(site.sitePath, site.publishDir);
  await ensureDirectoryExists(site.sitePath, `Site root for ${site.slug}`);
  await ensureDirectoryExists(publishDirectory, `Publish directory for ${site.slug}`);
  return publishDirectory;
};

export const buildPublishPlan = async (config, site) => {
  const publishDirectory = await resolvePublishDirectory(site);
  const files = await listFilesRecursive(publishDirectory);

  if (files.length === 0) {
    throw new Error(`Publish directory is empty for ${site.slug}: ${publishDirectory}`);
  }

  const uploads = files.map((filePath) => {
    const relativePath = toPosixPath(path.relative(publishDirectory, filePath));
    return {
      absolutePath: filePath,
      relativePath,
      objectKey: buildLiveObjectKey({
        livePrefix: config.cloudflare.livePrefix,
        slug: site.slug,
        relativePath,
      }),
      contentType: detectContentType(relativePath),
      cacheControl: detectCacheControl(relativePath),
    };
  });

  return {
    slug: site.slug,
    publishDirectory,
    uploads,
  };
};

export const buildBackupPlan = async (config, site, timestamp) => {
  await ensureDirectoryExists(site.sitePath, `Site root for ${site.slug}`);
  const includedFiles = await listFilesRecursive(site.sitePath, (relativePath) =>
    shouldExcludeFromBackup(relativePath),
  );

  if (includedFiles.length === 0) {
    throw new Error(`No backup files found for ${site.slug}: ${site.sitePath}`);
  }

  return {
    slug: site.slug,
    sitePath: site.sitePath,
    includedFiles,
    objectKey: buildBackupObjectKey({
      backupPrefix: config.cloudflare.backupPrefix,
      slug: site.slug,
      timestamp,
    }),
  };
};

export const resolveR2ConfigFromEnv = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const liveBucket = process.env.CF_LIVE_BUCKET;
  const backupBucket = process.env.CF_BACKUP_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !liveBucket || !backupBucket) {
    throw new Error(
      "Missing required deploy environment. Expected R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CF_LIVE_BUCKET, and CF_BACKUP_BUCKET.",
    );
  }

  return {
    endpoint:
      process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`,
    region: process.env.R2_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
    liveBucket,
    backupBucket,
  };
};

export const createR2Client = (r2Config) =>
  new S3Client({
    region: r2Config.region,
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
  });

export const listAllObjectKeys = async (client, bucket, prefix) => {
  const discoveredKeys = [];
  let continuationToken;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      if (item.Key) {
        discoveredKeys.push(item.Key);
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return discoveredKeys;
};

const chunkArray = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

export const deleteObjectKeys = async (client, bucket, keys) => {
  for (const batch of chunkArray(keys, 1000)) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
  }
};

export const uploadFile = async ({
  client,
  bucket,
  key,
  filePath,
  contentType,
  cacheControl,
}) => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
};

export const uploadText = async ({
  client,
  bucket,
  key,
  body,
  contentType,
  cacheControl,
}) => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
};

export const createPublishManifest = ({ config, site, timestamp, uploads }) =>
  JSON.stringify(
    {
      slug: site.slug,
      host: `${site.slug}.${config.cloudflare.domainSuffix}`,
      sourcePath: site.sitePath,
      publishDir: site.publishDir,
      publishedAt: timestamp,
      fileCount: uploads.length,
      files: uploads.map((upload) => upload.relativePath),
    },
    null,
    2,
  );

export const createArchiveFromDirectory = async ({
  sourceDirectory,
  outputPath,
}) => {
  await mkdir(path.dirname(outputPath), { recursive: true });

  await new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const output = createWriteStream(outputPath);

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.glob("**/*", {
      cwd: sourceDirectory,
      dot: true,
      ignore: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.wrangler/**",
        "**/coverage/**",
      ],
    });

    archive.finalize();
  });
};

export const createTemporaryZipPath = async (slug, timestamp) => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-backup-"));
  return {
    tempDirectory,
    zipPath: path.join(tempDirectory, `${slug}-${timestamp}.zip`),
  };
};

export const cleanupTemporaryDirectory = async (directoryPath) => {
  await rm(directoryPath, { recursive: true, force: true });
};

export const writeJsonFile = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
