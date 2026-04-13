import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createStaticServer } from "./static-server.js";

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, "dist");
const minCategoryScore = Number(process.env.LIGHTHOUSE_MIN_SCORE ?? 95);

const categoryThresholds = [
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "best-practices", label: "Best Practices" },
  { key: "seo", label: "SEO" },
] as const;

const metricThresholds = [
  {
    key: "cumulative-layout-shift",
    label: "CLS",
    maxValue: Number(process.env.LIGHTHOUSE_MAX_CLS ?? 0.1),
    format: (value: number) => value.toFixed(3),
  },
  {
    key: "largest-contentful-paint",
    label: "LCP",
    maxValue: Number(process.env.LIGHTHOUSE_MAX_LCP_MS ?? 3000),
    format: (value: number) => `${Math.round(value)}ms`,
  },
  ...(process.env.LIGHTHOUSE_MAX_TBT_MS
    ? [
        {
          key: "total-blocking-time",
          label: "TBT",
          maxValue: Number(process.env.LIGHTHOUSE_MAX_TBT_MS),
          format: (value: number) => `${Math.round(value)}ms`,
        },
      ]
    : []),
] as const;

const runCommand = (command: string, args: string[], cwd: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code ?? "unknown"}: ${command} ${args.join(" ")}`));
    });
  });

const runLighthouse = async (url: string, reportPath: string): Promise<void> => {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";

  await runCommand(
    command,
    [
      "--yes",
      "lighthouse@12",
      url,
      "--quiet",
      "--output=json",
      `--output-path=${reportPath}`,
      "--chrome-flags=--headless --disable-gpu --no-sandbox",
      "--only-categories=performance,accessibility,best-practices,seo",
    ],
    repoRoot,
  );
};

const formatPercent = (score: number): string => `${Math.round(score * 100)}`;

const main = async (): Promise<void> => {
  if (!existsSync(distDir)) {
    throw new Error(
      `Missing build output at ${path.relative(repoRoot, distDir)}. Run npm run build:site first.`,
    );
  }

  const server = await createStaticServer(distDir);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-lighthouse-"));
  const reportPath = path.join(tempDir, "lighthouse-report.json");

  try {
    await runLighthouse(`${server.origin}/`, reportPath);

    const report = JSON.parse(await readFile(reportPath, "utf8")) as {
      categories?: Record<string, { score?: number | null }>;
      audits?: Record<string, { numericValue?: number | null }>;
    };

    const categoryScores = categoryThresholds.map(({ key, label }) => {
      const score = report.categories?.[key]?.score;

      if (typeof score !== "number") {
        throw new Error(`Missing Lighthouse category score for ${label}.`);
      }

      return { key, label, score };
    });

    const failedCategories = categoryScores.filter(({ score }) => score * 100 < minCategoryScore);

    const metricScores = metricThresholds.map(({ key, label, maxValue, format }) => {
      const value = report.audits?.[key]?.numericValue;

      if (typeof value !== "number") {
        throw new Error(`Missing Lighthouse audit value for ${label}.`);
      }

      return { key, label, value, maxValue, format };
    });

    const failedMetrics = metricScores.filter(({ value, maxValue }) => value > maxValue);

    console.log(
      `Lighthouse scores: ${categoryScores
        .map(({ label, score }) => `${label} ${formatPercent(score)}`)
        .join(", ")}`,
    );

    if (metricScores.length > 0) {
      console.log(
        `Lighthouse metrics: ${metricScores
          .map(({ label, value, format }) => `${label} ${format(value)}`)
          .join(", ")}`,
      );
    }

    if (failedCategories.length > 0 || failedMetrics.length > 0) {
      const messages = [
        ...failedCategories.map(
          ({ label, score }) => `${label} score ${formatPercent(score)} is below ${minCategoryScore}`,
        ),
        ...failedMetrics.map(
          ({ label, value, maxValue, format }) =>
            `${label} ${format(value)} exceeds ${format(maxValue)}`,
        ),
      ];

      throw new Error(`Lighthouse thresholds failed:\n- ${messages.join("\n- ")}`);
    }
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
};

try {
  await main();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
