import { mkdir, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import path from "node:path";
import type { ZodIssue } from "zod";

import { SiteContentSchema, type SiteContentData } from "../schemas/site.schema.js";
import { renderSitePreview } from "./framework.js";

export interface EditorPreviewServerOptions {
  contentPath?: string;
  host?: string;
  port?: number;
}

export interface EditorPreviewServer {
  close: () => Promise<void>;
  getDraft: () => SiteContentData;
  origin: string;
  saveDraft: () => Promise<void>;
  updateDraft: (siteContent: SiteContentData) => void;
}

class PreviewHttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PreviewHttpError";
  }
}

const previewStylesheetPath = "/__preview/assets/site.css";
const previewScriptPath = "/__preview/assets/site.js";
const draftEndpointPath = "/__preview/draft";
const eventsEndpointPath = "/__preview/events";
const saveEndpointPath = "/__preview/save";

const normalizePreviewSlug = (pathname: string): string => {
  const decodedPathname = decodeURIComponent(pathname);

  if (decodedPathname === "/") {
    return "/";
  }

  return decodedPathname.replace(/\/+$/u, "") || "/";
};

const previewAssetHref = (assetPath: string, slug: string): string =>
  `${assetPath}?slug=${encodeURIComponent(slug)}`;

const readRequestBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
};

const formatIssuePath = (issue: ZodIssue): string =>
  issue.path.reduce<string>((pathString, segment) => {
    if (typeof segment === "number") {
      return `${pathString}[${segment}]`;
    }

    return pathString ? `${pathString}.${segment}` : segment;
  }, "");

const parseDraftPayload = async (request: IncomingMessage): Promise<SiteContentData> => {
  const body = await readRequestBody(request);

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(body) as unknown;
  } catch (error) {
    throw new PreviewHttpError(
      400,
      error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON",
    );
  }

  const parsed = SiteContentSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => {
        const pathString = formatIssuePath(issue);
        return pathString ? `${pathString}: ${issue.message}` : issue.message;
      })
      .join("; ");
    throw new PreviewHttpError(400, `Invalid site draft: ${issues}`);
  }

  return parsed.data;
};

const sendText = (
  response: ServerResponse,
  statusCode: number,
  contentType: string,
  body: string,
): void => {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": contentType,
  });
  response.end(body);
};

const renderLivePreviewRuntime = (): string =>
  [
    '    <script data-cruftless-preview-reload="true">',
    "      (() => {",
    '        if (!("EventSource" in window)) {',
    "          return;",
    "        }",
    `        const source = new EventSource(${JSON.stringify(eventsEndpointPath)});`,
    '        source.addEventListener("reload", () => {',
    "          window.location.reload();",
    "        });",
    "      })();",
    "    </script>",
  ].join("\n");

const injectLivePreviewRuntime = (html: string): string => {
  const runtime = renderLivePreviewRuntime();

  if (html.includes("  </body>")) {
    return html.replace("  </body>", `${runtime}\n  </body>`);
  }

  return `${html}\n${runtime}`;
};

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

export const createEditorPreviewServer = async (
  initialDraft: SiteContentData,
  options: EditorPreviewServerOptions = {},
): Promise<EditorPreviewServer> => {
  let currentDraft = initialDraft;
  const host = options.host ?? "127.0.0.1";
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

  const saveDraft = async (): Promise<void> => {
    if (!options.contentPath) {
      throw new Error("Cannot save preview draft without a contentPath.");
    }

    await mkdir(path.dirname(options.contentPath), { recursive: true });
    await writeFile(options.contentPath, `${JSON.stringify(currentDraft, null, 2)}\n`, "utf8");
  };

  const renderPreviewForRequest = async (requestUrl: URL) => {
    const slugFromQuery = requestUrl.searchParams.get("slug");
    const slug = slugFromQuery
      ? normalizePreviewSlug(slugFromQuery)
      : normalizePreviewSlug(requestUrl.pathname);

    return renderSitePreview(currentDraft, slug, {
      stylesheetHref: previewAssetHref(previewStylesheetPath, slug),
      scriptHref: previewAssetHref(previewScriptPath, slug),
    });
  };

  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const requestUrl = new URL(request.url ?? "/", `http://${host}`);

    try {
      if (request.method === "GET" && requestUrl.pathname === previewStylesheetPath) {
        const preview = await renderPreviewForRequest(requestUrl);
        sendText(response, 200, "text/css; charset=utf-8", preview.css);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === previewScriptPath) {
        const preview = await renderPreviewForRequest(requestUrl);
        if (!preview.js) {
          sendText(response, 404, "text/plain; charset=utf-8", "Not found");
          return;
        }

        sendText(response, 200, "text/javascript; charset=utf-8", preview.js);
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === draftEndpointPath) {
        currentDraft = await parseDraftPayload(request);
        sendText(response, 204, "text/plain; charset=utf-8", "");
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === eventsEndpointPath) {
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

      if (request.method === "POST" && requestUrl.pathname === saveEndpointPath) {
        if ((request.headers["content-length"] ?? "0") !== "0") {
          currentDraft = await parseDraftPayload(request);
        }

        await saveDraft();
        sendText(response, 204, "text/plain; charset=utf-8", "");
        notifyLivePreviewClients();
        return;
      }

      if (request.method === "GET") {
        const preview = await renderPreviewForRequest(requestUrl);
        sendText(response, 200, "text/html; charset=utf-8", injectLivePreviewRuntime(preview.html));
        return;
      }

      sendText(response, 405, "text/plain; charset=utf-8", "Method not allowed");
    } catch (error) {
      if (error instanceof PreviewHttpError) {
        sendText(response, error.statusCode, "text/plain; charset=utf-8", error.message);
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      const statusCode = message.startsWith("No page exists") ? 404 : 500;
      sendText(response, statusCode, "text/plain; charset=utf-8", message);
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
    throw new Error("Failed to resolve editor preview server address.");
  }

  return {
    close: async () => {
      livePreviewClients.forEach((client) => {
        client.end();
      });
      livePreviewClients.clear();
      await closeServer(server);
    },
    getDraft: () => currentDraft,
    origin: `http://${host}:${address.port}`,
    saveDraft,
    updateDraft: (siteContent: SiteContentData) => {
      currentDraft = siteContent;
      notifyLivePreviewClients();
    },
  };
};
