import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");
const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

const validSiteContent = {
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

const invalidSiteContent = {
  ...validSiteContent,
  pages: [
    {
      slug: "/",
      title: "Home",
      components: [
        {
          type: "hero",
          headline: "Launch faster",
        },
      ],
    },
  ],
};

const waitForText = async (
  readText: () => string,
  pattern: RegExp,
  timeoutMs: number = 15_000,
): Promise<string> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const text = readText();
    if (pattern.test(text)) {
      return text;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }

  throw new Error(`Timed out waiting for output matching ${pattern}: ${readText()}`);
};

const waitFor = async (
  check: () => boolean,
  timeoutMs: number = 15_000,
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (check()) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }

  throw new Error("Timed out waiting for condition.");
};

const countMatches = (text: string, pattern: RegExp): number =>
  Array.from(text.matchAll(pattern)).length;

const waitForWatcherTick = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 350);
  });
};

const wait = async (timeoutMs: number): Promise<"timeout"> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve("timeout");
    }, timeoutMs);
  });

const signalChildTree = (
  child: ChildProcess,
  signal: NodeJS.Signals,
): void => {
  try {
    if (process.platform !== "win32" && child.pid) {
      process.kill(-child.pid, signal);
      return;
    }

    child.kill(signal);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
      throw error;
    }
  }
};

const stopChildTree = async (child: ChildProcess): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const closePromise = once(child, "close").then(() => "closed" as const);

  signalChildTree(child, "SIGTERM");

  if ((await Promise.race([closePromise, wait(5_000)])) === "closed") {
    return;
  }

  if (child.exitCode === null && child.signalCode === null) {
    signalChildTree(child, "SIGKILL");
  }

  await closePromise;
};

describe("build watch mode", () => {
  it("keeps watching after validation failures and rebuilds when content is fixed", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-build-watch-"));
    const contentPath = path.join(tempDir, "site.json");
    const outDir = path.join(tempDir, "dist");

    let stdout = "";
    let stderr = "";

    try {
      await writeFile(contentPath, `${JSON.stringify(validSiteContent, null, 2)}\n`, "utf8");

      const child = spawn(process.execPath, [tsxCliPath, "src/build/build.ts", contentPath, outDir, "--watch"], {
        cwd: repoRoot,
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      try {
        await waitForText(() => stdout, /Watching .*site\.json for changes\.\.\./);
        const initialBuildCount = countMatches(stdout, /Built 1 page\(s\) into .*dist/g);

        await writeFile(contentPath, `${JSON.stringify(invalidSiteContent, null, 2)}\n`, "utf8");
        await waitForWatcherTick();
        await waitForText(() => stderr, /Validation failed in .*site\.json/);
        await waitForText(() => stderr, /At least one CTA is required/);

        await waitForWatcherTick();
        expect(child.exitCode).toBeNull();

        const repairedSiteContent = {
          ...validSiteContent,
          pages: [
            {
              ...validSiteContent.pages[0],
              title: "Recovered Home",
            },
          ],
        };

        await writeFile(contentPath, `${JSON.stringify(repairedSiteContent, null, 2)}\n`, "utf8");
        await waitForWatcherTick();
        await waitFor(() => countMatches(stdout, /Built 1 page\(s\) into .*dist/g) === initialBuildCount + 1);
        expect(countMatches(stdout, /Built 1 page\(s\) into .*dist/g)).toBe(initialBuildCount + 1);
      } finally {
        await stopChildTree(child);
      }
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }, 30_000);
});
