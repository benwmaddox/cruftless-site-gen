import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const contentTypeByExtension: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

const resolveRequestPath = async (
  outDir: string,
  request: IncomingMessage,
): Promise<string | null> => {
  const requestPath = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const relativePath = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const candidatePath = path.resolve(outDir, relativePath);

  if (path.relative(outDir, candidatePath).startsWith("..")) {
    return null;
  }

  const candidateStats = await stat(candidatePath).catch(() => null);
  if (candidateStats?.isDirectory()) {
    return path.join(candidatePath, "index.html");
  }

  if (candidateStats?.isFile()) {
    return candidatePath;
  }

  const indexPath = path.resolve(outDir, relativePath, "index.html");
  if (path.relative(outDir, indexPath).startsWith("..")) {
    return null;
  }

  const indexStats = await stat(indexPath).catch(() => null);
  return indexStats?.isFile() ? indexPath : null;
};

export const createStaticServer = async (
  outDir: string,
): Promise<{ close: () => Promise<void>; origin: string }> => {
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const filePath = await resolveRequestPath(outDir, request);
      if (!filePath) {
        response.writeHead(404).end("Not found");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type":
          contentTypeByExtension[path.extname(filePath)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve static server address.");
  }

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
    origin: `http://127.0.0.1:${address.port}`,
  };
};
