import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

const runNodeScript = (scriptPath: string, args: string[]) =>
  spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });

describe("deploy scripts", () => {
  it("supports dry-run publish and backup with a generated site config", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-deploy-"));
    const siteRoot = path.join(tempDir, "alpha-site");
    const distDir = path.join(siteRoot, "dist");
    const contentDir = path.join(siteRoot, "content");
    const configPath = path.join(tempDir, "sites.json");

    try {
      await mkdir(path.join(distDir, "about"), { recursive: true });
      await mkdir(contentDir, { recursive: true });
      await writeFile(path.join(distDir, "index.html"), "<h1>Alpha</h1>\n", "utf8");
      await writeFile(path.join(distDir, "about", "index.html"), "<h1>About</h1>\n", "utf8");
      await writeFile(path.join(distDir, "assets.css"), "body{}\n", "utf8");
      await writeFile(path.join(contentDir, "site.json"), "{ }\n", "utf8");
      await writeFile(
        configPath,
        JSON.stringify(
          {
            sites: [
              {
                slug: "alpha-site",
                sitePath: siteRoot,
                publishDir: "dist",
              },
            ],
          },
          null,
          2,
        ),
        "utf8",
      );

      const publishResult = runNodeScript("scripts/publish-sites.mjs", [
        "--config",
        configPath,
        "--dry-run",
      ]);
      expect(publishResult.status).toBe(0);
      expect(publishResult.stdout).toContain("would upload 3 files");
      expect(publishResult.stdout).toContain("live/alpha-site");

      const backupResult = runNodeScript("scripts/backup-sites.mjs", [
        "--config",
        configPath,
        "--dry-run",
        "--timestamp",
        "2026-04-10T16:20:30Z",
      ]);
      expect(backupResult.status).toBe(0);
      expect(backupResult.stdout).toContain("would archive 4 files");
      expect(backupResult.stdout).toContain("backups/alpha-site/2026-04-10T16-20-30Z.zip");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
