import path from "node:path";

import { resolveSiteTargetPaths } from "../build/site-target.js";
import { createSiteEditorServer } from "./site-editor-server.js";

const args = process.argv.slice(2);
const positionalArgs: string[] = [];
let host = "127.0.0.1";
let port: number | undefined;
let siteDirArg: string | undefined;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--site-dir" || arg === "--site") {
    const sitePath = args[index + 1];
    if (!sitePath) {
      throw new Error(`Missing value after ${arg}`);
    }

    siteDirArg = sitePath;
    index += 1;
    continue;
  }

  if (arg.startsWith("--site-dir=")) {
    const sitePath = arg.slice("--site-dir=".length);
    if (!sitePath) {
      throw new Error("Missing value after --site-dir");
    }

    siteDirArg = sitePath;
    continue;
  }

  if (arg.startsWith("--site=")) {
    const sitePath = arg.slice("--site=".length);
    if (!sitePath) {
      throw new Error("Missing value after --site");
    }

    siteDirArg = sitePath;
    continue;
  }

  if (arg === "--host") {
    const value = args[index + 1];
    if (!value) {
      throw new Error("Missing value after --host");
    }

    host = value;
    index += 1;
    continue;
  }

  if (arg.startsWith("--host=")) {
    host = arg.slice("--host=".length);
    continue;
  }

  if (arg === "--port") {
    const value = args[index + 1];
    if (!value) {
      throw new Error("Missing value after --port");
    }

    port = Number(value);
    index += 1;
    continue;
  }

  if (arg.startsWith("--port=")) {
    port = Number(arg.slice("--port=".length));
    continue;
  }

  positionalArgs.push(arg);
}

if (
  positionalArgs.length > 1 ||
  (siteDirArg && positionalArgs.length > 0) ||
  (port !== undefined && (!Number.isInteger(port) || port <= 0))
) {
  throw new Error(
    "Usage: tsx src/editor/edit.ts [content-directory-or-json-file] [--host host] [--port port] or tsx src/editor/edit.ts --site-dir site-directory [--host host] [--port port]",
  );
}

const siteTarget = siteDirArg ? resolveSiteTargetPaths(siteDirArg) : undefined;
const contentPath =
  siteTarget?.contentRoot ?? path.resolve(process.cwd(), positionalArgs[0] ?? "content");
const server = await createSiteEditorServer({
  contentPath,
  host,
  port,
});

console.log(`Editing ${path.relative(process.cwd(), server.contentRoot) || "."}`);
console.log(`Open ${server.origin}`);

const stopServer = async (): Promise<void> => {
  await server.close();
  process.exit();
};

process.on("SIGINT", () => {
  void stopServer();
});
process.on("SIGTERM", () => {
  void stopServer();
});
