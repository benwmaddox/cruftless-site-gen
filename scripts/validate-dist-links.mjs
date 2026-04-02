import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const supportedScanExtensions = new Set([
  ".css",
  ".htm",
  ".html",
  ".js",
  ".mjs",
  ".cjs",
]);

const htmlReferencePattern = /\b(?:href|src|srcset)\s*=\s*(["'])(.*?)\1/gi;
const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
const cssImportPattern =
  /@import\s+(?:url\(\s*(["']?)(.*?)\1\s*\)|(["'])(.*?)\3)/gi;
const jsDynamicImportPattern = /\bimport\s*\(\s*(["'])(.*?)\1\s*\)/g;
const jsStaticImportPattern = /\bimport\s+(?:[^"'()]+\s+from\s+)?(["'])(.*?)\1/g;

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

const normalizeReference = (reference) => {
  const trimmed = reference.trim();

  if (!trimmed) {
    return "";
  }

  const withoutQueryOrHash = trimmed.split(/[?#]/, 1)[0]?.trim() ?? "";

  if (!withoutQueryOrHash) {
    return "";
  }

  try {
    return decodeURIComponent(withoutQueryOrHash);
  } catch {
    return withoutQueryOrHash;
  }
};

export const isSameSiteRelativeReference = (reference) => {
  const normalized = normalizeReference(reference);

  if (!normalized || normalized.startsWith("#")) {
    return false;
  }

  if (normalized.startsWith("//")) {
    return false;
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(normalized)) {
    return false;
  }

  return true;
};

const extractHtmlReferences = (contents) => {
  const references = [];

  for (const match of contents.matchAll(new RegExp(htmlReferencePattern.source, htmlReferencePattern.flags))) {
    const [, , rawValue] = match;

    if (match[0].toLowerCase().includes("srcset")) {
      references.push(
        ...rawValue
          .split(",")
          .map((entry) => entry.trim().split(/\s+/, 1)[0] ?? "")
          .filter(Boolean),
      );
      continue;
    }

    references.push(rawValue);
  }

  return references;
};

const extractCssReferences = (contents) => {
  const references = [];

  for (const match of contents.matchAll(new RegExp(cssUrlPattern.source, cssUrlPattern.flags))) {
    const [, , rawValue] = match;
    references.push(rawValue);
  }

  for (const match of contents.matchAll(new RegExp(cssImportPattern.source, cssImportPattern.flags))) {
    const rawValue = match[2] ?? match[4] ?? "";
    references.push(rawValue);
  }

  return references;
};

const extractJavaScriptReferences = (contents) => [
  ...Array.from(
    contents.matchAll(new RegExp(jsDynamicImportPattern.source, jsDynamicImportPattern.flags)),
    (match) => match[2],
  ),
  ...Array.from(
    contents.matchAll(new RegExp(jsStaticImportPattern.source, jsStaticImportPattern.flags)),
    (match) => match[2],
  ),
];

export const extractReferencesFromFile = (filePath, contents) => {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html" || extension === ".htm") {
    return extractHtmlReferences(contents);
  }

  if (extension === ".css") {
    return extractCssReferences(contents);
  }

  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    return extractJavaScriptReferences(contents);
  }

  return [];
};

const collectScanFiles = (directory) => {
  const entries = readdirSync(directory)
    .map((name) => path.join(directory, name))
    .sort((left, right) => left.localeCompare(right));

  return entries.flatMap((entry) => {
    const stats = statSync(entry);

    if (stats.isDirectory()) {
      return collectScanFiles(entry);
    }

    return supportedScanExtensions.has(path.extname(entry).toLowerCase()) ? [entry] : [];
  });
};

const isInsideRoot = (rootDir, targetPath) => {
  const relativePath = path.relative(rootDir, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};

const resolveReferenceCandidates = (sourceFilePath, reference, distDir) => {
  const normalized = normalizeReference(reference);
  const sourceDir = path.dirname(sourceFilePath);
  const baseDir = normalized.startsWith("/") ? distDir : sourceDir;
  const resolvedTarget = path.resolve(baseDir, normalized.replace(/^\/+/, ""));

  if (!isInsideRoot(distDir, resolvedTarget)) {
    return {
      normalized,
      candidates: [],
      reason: "resolves outside dist",
    };
  }

  if (normalized === "/") {
    return {
      normalized,
      candidates: [path.join(distDir, "index.html")],
      reason: null,
    };
  }

  if (normalized.endsWith("/")) {
    return {
      normalized,
      candidates: [path.join(resolvedTarget, "index.html")],
      reason: null,
    };
  }

  if (path.extname(normalized)) {
    return {
      normalized,
      candidates: [resolvedTarget],
      reason: null,
    };
  }

  return {
    normalized,
    candidates: [
      resolvedTarget,
      `${resolvedTarget}.html`,
      path.join(resolvedTarget, "index.html"),
    ],
    reason: null,
  };
};

export const findBrokenDistReferences = (distDir) => {
  const resolvedDistDir = path.resolve(distDir);

  if (!existsSync(resolvedDistDir)) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), resolvedDistDir) || "dist"}. Run the site build before validating dist references.`,
    );
  }

  const scanFiles = collectScanFiles(resolvedDistDir);
  const problems = [];
  const problemKeys = new Set();

  for (const filePath of scanFiles) {
    const contents = readFileSync(filePath, "utf8");
    const references = extractReferencesFromFile(filePath, contents);

    for (const reference of references) {
      if (!isSameSiteRelativeReference(reference)) {
        continue;
      }

      const resolution = resolveReferenceCandidates(filePath, reference, resolvedDistDir);
      const targetExists = resolution.candidates.some((candidatePath) => existsSync(candidatePath));

      if (!targetExists) {
        const problem = {
          sourcePath: filePath,
          reference: resolution.normalized,
          candidates: resolution.candidates,
          reason: resolution.reason ?? "missing target",
        };
        const problemKey = `${problem.sourcePath}::${problem.reference}::${problem.reason}`;

        if (!problemKeys.has(problemKey)) {
          problems.push(problem);
          problemKeys.add(problemKey);
        }
      }
    }
  }

  return problems;
};

if (isDirectExecution) {
  const distDir = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(process.cwd(), "dist");
  const problems = findBrokenDistReferences(distDir);

  if (problems.length === 0) {
    console.log(
      `Validated same-site relative references in ${path.relative(process.cwd(), distDir) || "dist"}.`,
    );
    process.exit(0);
  }

  console.error("Broken dist references found:");

  for (const problem of problems) {
    const sourcePath = path.relative(process.cwd(), problem.sourcePath);
    const candidateList = problem.candidates
      .map((candidatePath) => path.relative(process.cwd(), candidatePath))
      .join(", ");

    console.error(
      `- ${sourcePath}: ${problem.reference} (${problem.reason}; checked ${candidateList || "no valid in-dist target"})`,
    );
  }

  process.exit(1);
}
