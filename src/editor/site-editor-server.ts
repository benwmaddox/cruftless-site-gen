import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as buildEditorBundle } from "esbuild";
import type { ZodIssue } from "zod";

import { renderSitePreview } from "../build/framework.js";
import { SiteContentSchema, type SiteContentData } from "../schemas/site.schema.js";
import { editorConfig } from "./editor-config.js";

export interface SiteEditorServerOptions {
  contentPath: string;
  host?: string;
  port?: number;
}

export interface EditorValidationIssue {
  message: string;
  path: (string | number)[];
}

export interface EditableFileSummary {
  name: string;
  path: string;
  valid: boolean;
  siteName?: string;
  pageCount?: number;
  error?: string;
}

export interface EditableDirectorySummary {
  name: string;
  path: string;
  snapToContent: boolean;
}

export interface EditorFileBrowserListing {
  contentRoot: string;
  directory: string;
  directories: EditableDirectorySummary[];
  files: EditableFileSummary[];
  parentDirectory?: string;
  selectedFile: string;
}

export interface EditableMediaFile {
  href: string;
  kind: "audio" | "image" | "video";
  path: string;
  relativePath: string;
}

export interface EditorMediaBrowserListing {
  contentRoot: string;
  directory: string;
  files: EditableMediaFile[];
}

export interface SiteEditorServer {
  close: () => Promise<void>;
  contentRoot: string;
  getDraft: () => SiteContentData;
  getSelectedFilePath: () => string;
  origin: string;
}

class EditorHttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly issues?: readonly EditorValidationIssue[],
  ) {
    super(message);
    this.name = "EditorHttpError";
  }
}

const staticRoot = fileURLToPath(new URL("./static/", import.meta.url));
const editorAppSourcePath = fileURLToPath(new URL("./static/app.jsx", import.meta.url));
const editorAssetPrefix = "/__editor/assets/";
const editorFilesPath = "/__editor/files";
const editorConfigPath = "/__editor/config";
const editorOpenDirectoryPath = "/__editor/open-directory";
const editorOpenPath = "/__editor/open";
const editorMediaPath = "/__editor/media";
const editorSavePath = "/__editor/save";
const previewPagePath = "/__preview/page";
const previewStylesheetPath = "/__preview/assets/site.css";
const previewScriptPath = "/__preview/assets/site.js";
const previewDraftPath = "/__preview/draft";
const previewEventsPath = "/__preview/events";
const previewSavePath = "/__preview/save";
const contentAssetPrefix = "/content/";
const contentDirectoryName = "content";
const maxContentRootSearchDepth = 3;
const mediaFileExtensions = new Map<string, "audio" | "image" | "video">([
  [".avif", "image"],
  [".gif", "image"],
  [".jpeg", "image"],
  [".jpg", "image"],
  [".mp3", "audio"],
  [".mp4", "video"],
  [".png", "image"],
  [".svg", "image"],
  [".wav", "audio"],
  [".webm", "video"],
  [".webp", "image"],
]);
const skippedContentSearchDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "reports",
]);

const toContentAssetHref = (relativePath: string): string =>
  `${contentAssetPrefix}${relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

const send = (
  response: ServerResponse,
  statusCode: number,
  contentType: string,
  body: string | Buffer = "",
): void => {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": contentType,
  });
  response.end(body);
};

const sendJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  send(response, statusCode, "application/json; charset=utf-8", JSON.stringify(body));
};

const readRequestBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
};

const readJsonRequestBody = async (request: IncomingMessage): Promise<unknown> => {
  const body = await readRequestBody(request);

  if (!body.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new EditorHttpError(
      400,
      error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON",
    );
  }
};

const formatIssuePath = (issue: ZodIssue): string =>
  issue.path.reduce<string>((pathString, segment) => {
    if (typeof segment === "number") {
      return `${pathString}[${segment}]`;
    }

    return pathString ? `${pathString}.${segment}` : segment;
  }, "");

const formatSiteContentIssues = (issues: readonly ZodIssue[]): string =>
  issues
    .map((issue) => {
      const pathString = formatIssuePath(issue);
      return pathString ? `${pathString}: ${issue.message}` : issue.message;
    })
    .join("; ");

const serializeValidationIssues = (issues: readonly ZodIssue[]): EditorValidationIssue[] =>
  issues.map((issue) => ({
    message: issue.message,
    path: [...issue.path],
  }));

const parseSiteContent = (value: unknown): SiteContentData => {
  const parsed = SiteContentSchema.safeParse(value);

  if (!parsed.success) {
    throw new EditorHttpError(
      400,
      `Invalid site content: ${formatSiteContentIssues(parsed.error.issues)}`,
      serializeValidationIssues(parsed.error.issues),
    );
  }

  return parsed.data;
};

const parseDraftRequest = async (request: IncomingMessage): Promise<SiteContentData> =>
  parseSiteContent(await readJsonRequestBody(request));

const normalizePreviewSlug = (value: string): string => {
  const decoded = decodeURIComponent(value);

  if (decoded === "/") {
    return "/";
  }

  return decoded.replace(/\/+$/u, "") || "/";
};

const previewAssetHref = (assetPath: string, slug: string): string =>
  `${assetPath}?slug=${encodeURIComponent(slug)}`;

const closeServer = async (server: Server): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const resolveContentTarget = async (
  contentPath: string,
): Promise<{ root: string; singleFile?: string }> => {
  const resolvedPath = path.resolve(contentPath);
  const contentStat = await stat(resolvedPath);

  if (contentStat.isDirectory()) {
    return { root: resolvedPath };
  }

  if (contentStat.isFile() && path.extname(resolvedPath).toLowerCase() === ".json") {
    return {
      root: path.dirname(resolvedPath),
      singleFile: path.basename(resolvedPath),
    };
  }

  throw new Error("Editor content path must be a directory or a .json file.");
};

const assertRelativeJsonPath = (relativePath: string): string => {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/u, "");

  if (!normalized || normalized.split("/").includes("..") || path.isAbsolute(relativePath)) {
    throw new EditorHttpError(400, "Invalid content file path.");
  }

  if (path.extname(normalized).toLowerCase() !== ".json") {
    throw new EditorHttpError(400, "Editable content files must be JSON files.");
  }

  return normalized;
};

const assertJsonFilePath = (filePath: string): string => {
  if (path.extname(filePath).toLowerCase() !== ".json") {
    throw new EditorHttpError(400, "Editable content files must be JSON files.");
  }

  return path.resolve(filePath);
};

const resolveEditableFilePath = (
  contentRoot: string,
  relativePath: string,
  singleFile?: string,
): string => {
  const normalized = assertRelativeJsonPath(relativePath);

  if (singleFile && normalized !== singleFile) {
    throw new EditorHttpError(404, "Content file is outside this editor session.");
  }

  const resolved = path.resolve(contentRoot, normalized);
  const rootWithSeparator = contentRoot.endsWith(path.sep) ? contentRoot : `${contentRoot}${path.sep}`;

  if (resolved !== contentRoot && !resolved.startsWith(rootWithSeparator)) {
    throw new EditorHttpError(400, "Content file is outside the editor root.");
  }

  return resolved;
};

const resolveBrowserFilePath = (
  browseDirectory: string,
  requestedPath: string,
): string => {
  if (path.isAbsolute(requestedPath)) {
    return assertJsonFilePath(requestedPath);
  }

  const normalized = assertRelativeJsonPath(requestedPath);

  return path.resolve(browseDirectory, normalized);
};

const resolveDirectoryWithinRoot = (rootPath: string, requestedPath: string): string => {
  const resolvedRootPath = path.resolve(rootPath);
  const resolvedRequestedPath = path.resolve(requestedPath);
  const rootWithSeparator = resolvedRootPath.endsWith(path.sep)
    ? resolvedRootPath
    : `${resolvedRootPath}${path.sep}`;

  if (resolvedRequestedPath !== resolvedRootPath && !resolvedRequestedPath.startsWith(rootWithSeparator)) {
    throw new EditorHttpError(400, "Directory is outside the editor root.");
  }

  return resolvedRequestedPath;
};

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

const collectMediaFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectMediaFiles(entryPath);
      }

      return entry.isFile() && mediaFileExtensions.has(path.extname(entry.name).toLowerCase())
        ? [entryPath]
        : [];
    }),
  );

  return nestedFiles.flat().sort();
};

const readSiteContentFile = async (filePath: string): Promise<SiteContentData> => {
  const rawFile = await readFile(filePath, "utf8");
  let rawData: unknown;

  try {
    rawData = JSON.parse(rawFile) as unknown;
  } catch (error) {
    throw new EditorHttpError(
      400,
      error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON",
    );
  }

  return parseSiteContent(rawData);
};

const summarizeEditableFile = async (
  filePath: string,
): Promise<EditableFileSummary> => {
  try {
    const siteContent = await readSiteContentFile(filePath);

    return {
      name: path.basename(filePath),
      path: filePath,
      valid: true,
      siteName: siteContent.site.name,
      pageCount: siteContent.pages.length,
    };
  } catch (error) {
    return {
      name: path.basename(filePath),
      path: filePath,
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const isContentSearchableDirectory = (directoryName: string): boolean =>
  !directoryName.startsWith(".")
  && !skippedContentSearchDirectories.has(directoryName.toLowerCase());

const findDirectContentDirectory = async (directoryPath: string): Promise<string | undefined> => {
  const resolvedPath = path.resolve(directoryPath);

  if (path.basename(resolvedPath).toLowerCase() === contentDirectoryName) {
    return resolvedPath;
  }

  const candidatePath = path.join(resolvedPath, contentDirectoryName);

  try {
    const candidateStat = await stat(candidatePath);

    if (candidateStat.isDirectory()) {
      return candidatePath;
    }
  } catch {
    return undefined;
  }

  return undefined;
};

const findNestedContentDirectory = async (
  directoryPath: string,
  maxDepth: number = maxContentRootSearchDepth,
): Promise<string | undefined> => {
  const resolvedPath = path.resolve(directoryPath);

  const directContentDirectory = await findDirectContentDirectory(resolvedPath);

  if (directContentDirectory) {
    return directContentDirectory;
  }

  if (maxDepth <= 0) {
    return undefined;
  }

  let entries;

  try {
    entries = await readdir(resolvedPath, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const directories = entries
    .filter((entry) => entry.isDirectory() && isContentSearchableDirectory(entry.name))
    .map((entry) => path.join(resolvedPath, entry.name))
    .sort((left, right) => left.localeCompare(right));

  for (const childDirectory of directories) {
    const nestedContentDirectory = await findNestedContentDirectory(childDirectory, maxDepth - 1);

    if (nestedContentDirectory) {
      return nestedContentDirectory;
    }
  }

  return undefined;
};

const findUniqueNestedContentDirectory = async (
  directoryPath: string,
  maxDepth: number = maxContentRootSearchDepth,
): Promise<string | undefined> => {
  const resolvedPath = path.resolve(directoryPath);
  const directContentDirectory = await findDirectContentDirectory(resolvedPath);

  if (directContentDirectory) {
    return directContentDirectory;
  }

  if (maxDepth <= 0) {
    return undefined;
  }

  let entries;

  try {
    entries = await readdir(resolvedPath, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const directories = entries
    .filter((entry) => entry.isDirectory() && isContentSearchableDirectory(entry.name))
    .map((entry) => path.join(resolvedPath, entry.name))
    .sort((left, right) => left.localeCompare(right));

  let candidate: string | undefined;

  for (const childDirectory of directories) {
    const nestedContentDirectory = await findUniqueNestedContentDirectory(childDirectory, maxDepth - 1);

    if (!nestedContentDirectory) {
      continue;
    }

    if (candidate && candidate !== nestedContentDirectory) {
      return undefined;
    }

    candidate = nestedContentDirectory;
  }

  return candidate;
};

const isInsideContentRoot = (contentRoot: string, directoryPath: string): boolean => {
  const resolvedContentRoot = path.resolve(contentRoot);
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const contentRootPrefix = resolvedContentRoot.endsWith(path.sep)
    ? resolvedContentRoot
    : `${resolvedContentRoot}${path.sep}`;

  return resolvedDirectoryPath === resolvedContentRoot || resolvedDirectoryPath.startsWith(contentRootPrefix);
};

const resolveBrowseDirectory = async (
  directoryPath: string,
  options?: { snapToContent?: "none" | "direct" | "nested" },
): Promise<string> => {
  if (!directoryPath.trim()) {
    throw new EditorHttpError(400, "Browser path is required.");
  }

  const resolvedPath = path.resolve(directoryPath);
  const directoryStat = await stat(resolvedPath);

  if (!directoryStat.isDirectory()) {
    throw new EditorHttpError(400, "Browser path must be a directory.");
  }

  if (!options?.snapToContent || options.snapToContent === "none") {
    return resolvedPath;
  }

  if (options.snapToContent === "direct") {
    return (await findDirectContentDirectory(resolvedPath)) ?? resolvedPath;
  }

  return (await findNestedContentDirectory(resolvedPath)) ?? resolvedPath;
};

const renderEditorHtml = (): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cruftless Content Editor</title>
    <link rel="stylesheet" href="/__editor/assets/app.css" />
  </head>
  <body>
    <div id="app" class="app-shell"></div>
    <script type="module" src="/__editor/assets/app.js"></script>
  </body>
</html>`;

const renderLivePreviewRuntime = (): string =>
  [
    '    <script data-cruftless-preview-runtime="true">',
    "      (() => {",
    '        if (!("EventSource" in window) || !("DOMParser" in window)) {',
    "          return;",
    "        }",
    `        const eventsUrl = ${JSON.stringify(previewEventsPath)};`,
    "        let refreshPromise = null;",
    "        let refreshQueued = false;",
    "        const bustHref = (href) => {",
    "          const url = new URL(href, window.location.href);",
    '          url.searchParams.set("__preview_ts", String(Date.now()));',
    "          return url.toString();",
    "        };",
    "        const syncManagedHead = (nextDocument) => {",
    '          const nextStylesheet = nextDocument.querySelector(\'link[rel=\"stylesheet\"]\');',
    '          const currentStylesheet = document.querySelector(\'link[rel=\"stylesheet\"]\');',
    '          if (currentStylesheet && nextStylesheet?.getAttribute(\"href\")) {',
    '            currentStylesheet.setAttribute(\"href\", bustHref(nextStylesheet.getAttribute(\"href\")));',
    "          }",
    "        };",
    "        const syncBody = (nextDocument) => {",
    "          const nextBody = nextDocument.body;",
    "          const scrollX = window.scrollX;",
    "          const scrollY = window.scrollY;",
    "          for (const name of document.body.getAttributeNames()) {",
    "            document.body.removeAttribute(name);",
    "          }",
    "          for (const name of nextBody.getAttributeNames()) {",
    "            const value = nextBody.getAttribute(name);",
    "            if (value !== null) {",
    "              document.body.setAttribute(name, value);",
    "            }",
    "          }",
    "          document.body.innerHTML = nextBody.innerHTML;",
    "          document.title = nextDocument.title;",
    "          syncManagedHead(nextDocument);",
    "          window.requestAnimationFrame(() => {",
    "            window.scrollTo(scrollX, scrollY);",
    "          });",
    "        };",
    "        const refreshPreview = async () => {",
    "          if (refreshPromise) {",
    "            refreshQueued = true;",
    "            return refreshPromise;",
    "          }",
    "          refreshPromise = (async () => {",
    "            do {",
    "              refreshQueued = false;",
    "              const nextUrl = new URL(window.location.href);",
    '              nextUrl.searchParams.set("__preview_reload", String(Date.now()));',
    '              const response = await fetch(nextUrl.toString(), { cache: "no-store" });',
    "              if (!response.ok) {",
    "                window.location.reload();",
    "                return;",
    "              }",
    "              const nextHtml = await response.text();",
    "              const nextDocument = new DOMParser().parseFromString(nextHtml, \"text/html\");",
    '              nextDocument.querySelector(\'script[data-cruftless-preview-runtime=\"true\"]\')?.remove();',
    "              syncBody(nextDocument);",
    "            } while (refreshQueued);",
    "          })().finally(() => {",
    "            refreshPromise = null;",
    "          });",
    "          return refreshPromise;",
    "        };",
    "        const source = new EventSource(eventsUrl);",
    '        source.addEventListener("reload", () => {',
    "          void refreshPreview();",
    "        });",
    "      })();",
    "    </script>",
  ].join("\n");

const injectLivePreviewRuntime = (html: string): string => {
  const runtime = renderLivePreviewRuntime();

  if (html.includes("  </head>")) {
    return html.replace("  </head>", `${runtime}\n  </head>`);
  }

  return `${runtime}\n${html}`;
};

const serveEditorAsset = async (pathname: string, response: ServerResponse): Promise<void> => {
  const assetName = pathname.slice(editorAssetPrefix.length);
  const safeAssetName = path.basename(assetName);

  if (safeAssetName === "app.js") {
    const bundle = await buildEditorBundle({
      bundle: true,
      entryPoints: [editorAppSourcePath],
      format: "esm",
      jsx: "automatic",
      logLevel: "silent",
      minify: false,
      platform: "browser",
      write: false,
    });

    send(
      response,
      200,
      "text/javascript; charset=utf-8",
      Buffer.from(bundle.outputFiles[0]?.contents ?? ""),
    );
    return;
  }

  const assetPath = path.join(staticRoot, safeAssetName);
  const extension = path.extname(safeAssetName).toLowerCase();
  const contentType =
    extension === ".js"
      ? "text/javascript; charset=utf-8"
      : extension === ".css"
        ? "text/css; charset=utf-8"
        : "application/octet-stream";

  send(response, 200, contentType, await readFile(assetPath));
};

const getContentAssetType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".avif") {
    return "image/avif";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".json") {
    return "application/json; charset=utf-8";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".svg") {
    return "image/svg+xml; charset=utf-8";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "application/octet-stream";
};

const resolveContentAssetPath = (contentRoot: string, pathname: string): string => {
  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    throw new EditorHttpError(400, "Invalid content asset path.");
  }

  const normalized = decodedPath
    .slice(contentAssetPrefix.length)
    .replaceAll("\\", "/")
    .replace(/^\/+/u, "");

  if (!normalized || normalized.split("/").includes("..") || path.isAbsolute(normalized)) {
    throw new EditorHttpError(400, "Invalid content asset path.");
  }

  const resolved = path.resolve(contentRoot, normalized);
  const rootWithSeparator = contentRoot.endsWith(path.sep) ? contentRoot : `${contentRoot}${path.sep}`;

  if (resolved !== contentRoot && !resolved.startsWith(rootWithSeparator)) {
    throw new EditorHttpError(400, "Content asset is outside the editor root.");
  }

  return resolved;
};

const serveContentAsset = async (
  contentRoot: string,
  pathname: string,
  response: ServerResponse,
): Promise<void> => {
  const assetPath = resolveContentAssetPath(contentRoot, pathname);
  let assetStat;

  try {
    assetStat = await stat(assetPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new EditorHttpError(404, "Content asset not found.");
    }

    throw error;
  }

  if (!assetStat.isFile()) {
    throw new EditorHttpError(404, "Content asset not found.");
  }

  send(response, 200, getContentAssetType(assetPath), await readFile(assetPath));
};

export const createSiteEditorServer = async (
  options: SiteEditorServerOptions,
): Promise<SiteEditorServer> => {
  const { root: initialContentRoot, singleFile } = await resolveContentTarget(options.contentPath);
  const host = options.host ?? "127.0.0.1";
  const initialFiles = singleFile
    ? [path.join(initialContentRoot, singleFile)]
    : await collectJsonFiles(initialContentRoot);
  const initialSummaries = await Promise.all(
    initialFiles.map((filePath) => summarizeEditableFile(filePath)),
  );
  const initialFile =
    initialSummaries.find((file) => file.valid && file.name === "site.json")?.path
    ?? initialSummaries.find((file) => file.valid)?.path;

  if (!initialFile) {
    throw new Error(`No valid site content JSON files found in ${initialContentRoot}.`);
  }

  let contentRoot = path.dirname(initialFile);
  let browseDirectory = contentRoot;
  let selectedFilePath = path.basename(initialFile);
  let currentDraft = await readSiteContentFile(path.join(contentRoot, selectedFilePath));
  const livePreviewClients = new Set<ServerResponse>();

  const notifyLivePreviewClients = (): void => {
    livePreviewClients.forEach((client) => {
      try {
        client.write("event: reload\ndata: {}\n\n");
      } catch {
        livePreviewClients.delete(client);
      }
    });
  };

  const selectedFileAbsolutePath = (): string => path.join(contentRoot, selectedFilePath);

  const listBrowserDirectory = async (): Promise<EditorFileBrowserListing> => {
    const entries = await readdir(browseDirectory, { withFileTypes: true });
    const inContentTree = isInsideContentRoot(contentRoot, browseDirectory);
    const candidateDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(browseDirectory, entry.name),
      }));
    const directories = inContentTree
      ? candidateDirectories
        .map((entry) => ({
          ...entry,
          snapToContent: false,
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
      : (await Promise.all(
        candidateDirectories.map(async (entry) => ({
          ...entry,
          targetPath: await findNestedContentDirectory(entry.path),
          uniqueTargetPath: await findUniqueNestedContentDirectory(entry.path),
        })),
      ))
        .filter((entry) => entry.targetPath)
        .map(({ name, path: directoryPath, uniqueTargetPath }) => ({
          name,
          path: directoryPath,
          snapToContent: Boolean(uniqueTargetPath),
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".json")
        .map((entry) => summarizeEditableFile(path.join(browseDirectory, entry.name))),
    );
    const parentDirectory = path.dirname(browseDirectory);

    return {
      contentRoot,
      directory: browseDirectory,
      directories,
      files: files.sort((left, right) => left.name.localeCompare(right.name)),
      parentDirectory: parentDirectory === browseDirectory ? undefined : parentDirectory,
      selectedFile: selectedFileAbsolutePath(),
    };
  };

  const listMediaDirectory = async (requestedDirectory?: string): Promise<EditorMediaBrowserListing> => {
    const directoryPath = requestedDirectory
      ? resolveDirectoryWithinRoot(contentRoot, requestedDirectory)
      : browseDirectory;
    const resolvedDirectoryPath = isInsideContentRoot(contentRoot, directoryPath) ? directoryPath : contentRoot;
    const mediaFiles = await collectMediaFiles(resolvedDirectoryPath);

    return {
      contentRoot,
      directory: resolvedDirectoryPath,
      files: mediaFiles.map((filePath) => {
        const extension = path.extname(filePath).toLowerCase();
        const relativePath = path.relative(contentRoot, filePath).replaceAll("\\", "/");

        return {
          href: toContentAssetHref(relativePath),
          kind: mediaFileExtensions.get(extension) ?? "image",
          path: filePath,
          relativePath,
        };
      }),
    };
  };

  const saveDraft = async (): Promise<void> => {
    const filePath = resolveEditableFilePath(contentRoot, selectedFilePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(currentDraft, null, 2)}\n`, "utf8");
  };

  const renderPreviewForRequest = async (requestUrl: URL) => {
    const slug = normalizePreviewSlug(requestUrl.searchParams.get("slug") ?? requestUrl.pathname);

    return renderSitePreview(currentDraft, slug, {
      stylesheetHref: previewAssetHref(previewStylesheetPath, slug),
      scriptHref: previewAssetHref(previewScriptPath, slug),
    });
  };

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${host}`);

    try {
      if (request.method === "GET" && requestUrl.pathname === "/") {
        send(response, 200, "text/html; charset=utf-8", renderEditorHtml());
        return;
      }

      if (request.method === "GET" && requestUrl.pathname.startsWith(editorAssetPrefix)) {
        await serveEditorAsset(requestUrl.pathname, response);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname.startsWith(contentAssetPrefix)) {
        await serveContentAsset(contentRoot, requestUrl.pathname, response);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === editorConfigPath) {
        sendJson(response, 200, editorConfig);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === editorFilesPath) {
        sendJson(response, 200, await listBrowserDirectory());
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === editorMediaPath) {
        sendJson(response, 200, await listMediaDirectory(requestUrl.searchParams.get("directory") ?? undefined));
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === editorOpenDirectoryPath) {
        const payload = await readJsonRequestBody(request);
        const nextDirectoryPath =
          typeof payload === "object" && payload !== null && "path" in payload
            ? String((payload as { path: unknown }).path)
            : "";
        const rawSnapToContent =
          typeof payload === "object" && payload !== null && "snapToContent" in payload
            ? String((payload as { snapToContent: unknown }).snapToContent)
            : "none";
        const snapToContent =
          rawSnapToContent === "direct" || rawSnapToContent === "nested" ? rawSnapToContent : "none";

        browseDirectory = await resolveBrowseDirectory(nextDirectoryPath, { snapToContent });
        sendJson(response, 200, await listBrowserDirectory());
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === editorOpenPath) {
        const payload = await readJsonRequestBody(request);
        const nextFilePath =
          typeof payload === "object" && payload !== null && "path" in payload
            ? String((payload as { path: unknown }).path)
            : "";
        const resolvedPath = resolveBrowserFilePath(browseDirectory, nextFilePath);

        currentDraft = await readSiteContentFile(resolvedPath);
        contentRoot = path.dirname(resolvedPath);
        browseDirectory = contentRoot;
        selectedFilePath = path.basename(resolvedPath);
        sendJson(response, 200, {
          draft: currentDraft,
          browser: await listBrowserDirectory(),
          name: selectedFilePath,
          path: selectedFileAbsolutePath(),
        });
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === editorSavePath) {
        const payload = await readJsonRequestBody(request);

        if (payload !== undefined) {
          currentDraft = parseSiteContent(payload);
        }

        await saveDraft();
        sendJson(response, 200, {
          saved: true,
          path: selectedFilePath,
        });
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === previewPagePath) {
        const preview = await renderPreviewForRequest(requestUrl);
        send(response, 200, "text/html; charset=utf-8", injectLivePreviewRuntime(preview.html));
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === previewStylesheetPath) {
        const preview = await renderPreviewForRequest(requestUrl);
        send(response, 200, "text/css; charset=utf-8", preview.css);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === previewScriptPath) {
        const preview = await renderPreviewForRequest(requestUrl);

        if (!preview.js) {
          send(response, 404, "text/plain; charset=utf-8", "Not found");
          return;
        }

        send(response, 200, "text/javascript; charset=utf-8", preview.js);
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === previewDraftPath) {
        currentDraft = await parseDraftRequest(request);
        send(response, 204, "text/plain; charset=utf-8");
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === previewSavePath) {
        if ((request.headers["content-length"] ?? "0") !== "0") {
          currentDraft = await parseDraftRequest(request);
        }

        await saveDraft();
        send(response, 204, "text/plain; charset=utf-8");
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === previewEventsPath) {
        response.writeHead(200, {
          "cache-control": "no-store",
          "connection": "keep-alive",
          "content-type": "text/event-stream; charset=utf-8",
        });
        response.write("event: ready\ndata: {}\n\n");
        livePreviewClients.add(response);
        response.on("close", () => {
          livePreviewClients.delete(response);
        });
        return;
      }

      send(response, 404, "text/plain; charset=utf-8", "Not found");
    } catch (error) {
      if (error instanceof EditorHttpError) {
        sendJson(response, error.statusCode, {
          error: error.message,
          issues: error.issues,
        });
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      const statusCode = message.startsWith("No page exists") ? 404 : 500;
      sendJson(response, statusCode, { error: message });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer(server);
    throw new Error("Failed to resolve editor server address.");
  }

  return {
    close: async () => {
      livePreviewClients.forEach((client) => {
        client.end();
      });
      livePreviewClients.clear();
      await closeServer(server);
    },
    contentRoot,
    getDraft: () => currentDraft,
    getSelectedFilePath: () => selectedFileAbsolutePath(),
    origin: `http://${host}:${address.port}`,
  };
};
