import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

const siteContent = {
  site: {
    name: "LaunchKit",
    baseUrl: "https://launchkit.example",
    theme: "friendly-modern",
  },
  pages: [
    {
      slug: "/",
      title: "Home",
      components: [
        {
          type: "hero",
          headline: "Launch faster",
          primaryCta: {
            label: "Get started",
            href: "/start",
          },
        },
      ],
    },
  ],
};

const createStandaloneSite = async (): Promise<string> => {
  const siteDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-target-site-"));
  await mkdir(path.join(siteDir, "content"), { recursive: true });
  await writeFile(
    path.join(siteDir, "content", "site.json"),
    `${JSON.stringify(siteContent, null, 2)}\n`,
    "utf8",
  );
  return siteDir;
};

const runCli = (args: string[]) => {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed: node ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }

  return result;
};

describe("target site directory CLI", () => {
  it("builds a site directory into its own dist folder", async () => {
    const siteDir = await createStandaloneSite();

    try {
      const result = runCli([tsxCliPath, "src/build/build.ts", "--site-dir", siteDir]);

      expect(result.stdout).toContain("Built 1 page(s)");
      expect(result.stdout).toContain("dist");
      await expect(readFile(path.join(siteDir, "dist", "index.html"), "utf8")).resolves.toContain(
        "Launch faster",
      );
    } finally {
      await rm(siteDir, { recursive: true, force: true });
    }
  });

  it("runs the shared generator from this repo against a standalone target folder", async () => {
    const siteDir = await createStandaloneSite();

    try {
      const result = runCli(["scripts/shared-site-gen.mjs", "build", siteDir]);

      expect(result.stdout).toContain("Building");
      expect(result.stdout).toContain("Validated 1 page(s)");
      await expect(readFile(path.join(siteDir, "dist", "index.html"), "utf8")).resolves.toContain(
        "Launch faster",
      );
    } finally {
      await rm(siteDir, { recursive: true, force: true });
    }
  });
});
