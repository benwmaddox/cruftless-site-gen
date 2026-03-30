import { access, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSiteFromFile } from "../src/build/framework.js";

const contentRoot = path.resolve(process.cwd(), "content");

const collectJsonFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat().sort();
};

const pageSlugToOutputPath = (slug: string, outDir: string): string => {
  if (slug === "/") {
    return path.join(outDir, "index.html");
  }

  return path.join(outDir, slug.replace(/^\//, ""), "index.html");
};

describe("content fixtures", async () => {
  const contentFiles = await collectJsonFiles(contentRoot);

  it("discovers at least one JSON content fixture", () => {
    expect(contentFiles.length).toBeGreaterThan(0);
  });

  for (const contentFile of contentFiles) {
    const fixtureName = path.relative(contentRoot, contentFile);

    it(`validates and builds ${fixtureName}`, async () => {
      const outDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-"));

      try {
        const siteContent = await buildSiteFromFile(contentFile, outDir);

        await access(path.join(outDir, "assets", "site.css"));

        for (const page of siteContent.pages) {
          const outputPath = pageSlugToOutputPath(page.slug, outDir);
          await access(outputPath);

          const html = await readFile(outputPath, "utf8");
          expect(html).toContain("<!doctype html>");
          expect(html).toContain(`<title>${page.slug === "/" ? siteContent.site.name : `${page.title} | ${siteContent.site.name}`}</title>`);
        }
      } finally {
        await rm(outDir, { recursive: true, force: true });
      }
    });
  }
});
