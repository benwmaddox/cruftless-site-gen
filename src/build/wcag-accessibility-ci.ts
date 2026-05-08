import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

import { createStaticServer } from "./static-server.js";

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, "dist");
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const maxReportedNodesPerViolation = 3;

const collectHtmlFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedPaths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectHtmlFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
    }),
  );

  return nestedPaths.flat();
};

const filePathToUrlPath = (filePath: string): string => {
  const relativePath = path.relative(distDir, filePath).split(path.sep).join("/");
  return `/${relativePath}`;
};

type AxeViolation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

const formatViolation = (pagePath: string, violation: AxeViolation): string[] => {
  const helpUrl = violation.helpUrl ? ` (${violation.helpUrl})` : "";
  const lines = [
    `${pagePath}: ${violation.id} [${violation.impact ?? "unknown"}] ${violation.help}${helpUrl}`,
  ];

  violation.nodes.slice(0, maxReportedNodesPerViolation).forEach((node) => {
    lines.push(`  - ${node.target.join(", ")}: ${node.failureSummary ?? "No failure summary."}`);
  });

  if (violation.nodes.length > maxReportedNodesPerViolation) {
    lines.push(`  - ...and ${violation.nodes.length - maxReportedNodesPerViolation} more node(s)`);
  }

  return lines;
};

const main = async (): Promise<void> => {
  if (!existsSync(distDir)) {
    throw new Error(`Missing build output at ${path.relative(repoRoot, distDir)}. Run npm run build first.`);
  }

  const htmlFiles = (await collectHtmlFiles(distDir)).sort();

  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in ${path.relative(repoRoot, distDir)}.`);
  }

  const server = await createStaticServer(distDir);
  const browser = await chromium.launch();
  const violations: string[] = [];

  try {
    for (const htmlFile of htmlFiles) {
      const pagePath = filePathToUrlPath(htmlFile);
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(`${server.origin}${pagePath}`, {
          waitUntil: "networkidle",
        });

        const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        violations.push(...results.violations.flatMap((violation) => formatViolation(pagePath, violation)));
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  if (violations.length > 0) {
    throw new Error(`WCAG accessibility checks failed:\n- ${violations.join("\n- ")}`);
  }

  console.log(`WCAG accessibility checks passed for ${htmlFiles.length} page(s).`);
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
