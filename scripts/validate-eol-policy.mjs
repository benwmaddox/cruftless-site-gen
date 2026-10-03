#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const options = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--require-clean") {
    if (options.has("require-clean")) {
      fail("--require-clean may only be specified once");
    }
    options.set("require-clean", true);
    continue;
  }

  if (argument === "--base-ref") {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) {
      fail("--base-ref requires an explicit Git ref, for example origin/main");
    }
    if (options.has("base-ref")) {
      fail("--base-ref may only be specified once");
    }
    options.set("base-ref", value);
    index += 1;
    continue;
  }

  fail(`unknown argument ${argument}; usage: node scripts/validate-eol-policy.mjs [--base-ref <ref>] [--require-clean]`);
}

const requireClean = options.has("require-clean");
const baseRef = options.get("base-ref");

function fail(message) {
  console.error(`EOL policy validation failed: ${message}`);
  process.exit(1);
}

function runGit(args, input) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    input,
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error) {
    fail(`could not run git ${args.join(" ")}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`git ${args.join(" ")} exited ${result.status}: ${result.stderr.toString("utf8")}`);
  }

  return result.stdout;
}

function getOptionalGitConfig(name) {
  const result = spawnSync("git", ["config", "--get", name], {
    cwd: repositoryRoot,
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error) {
    fail(`could not read Git config ${name}: ${result.error.message}`);
  }

  if (result.status === 1) {
    return null;
  }
  if (result.status !== 0) {
    fail(`git config --get ${name} exited ${result.status}: ${result.stderr.toString("utf8")}`);
  }

  return result.stdout.toString("utf8").trim();
}

function splitNullTerminated(buffer) {
  const fields = buffer.toString("utf8").split("\0");
  if (fields.at(-1) === "") {
    fields.pop();
  }
  return fields;
}

function getAttributes(paths) {
  const input = Buffer.from(paths.map((filePath) => `${filePath}\0`).join(""), "utf8");
  const fields = splitNullTerminated(runGit(["check-attr", "-z", "--stdin", "text", "eol"], input));
  if (fields.length !== paths.length * 2 * 3) {
    fail(`expected ${paths.length * 2} attribute results, received ${fields.length / 3}`);
  }

  const attributes = new Map();
  for (let index = 0; index < fields.length; index += 3) {
    const [filePath, attribute, value] = fields.slice(index, index + 3);
    const fileAttributes = attributes.get(filePath) ?? {};
    fileAttributes[attribute] = value;
    attributes.set(filePath, fileAttributes);
  }
  return attributes;
}

function assertAttribute(attributes, filePath, expected) {
  const actual = attributes.get(filePath) ?? {};
  for (const [name, value] of Object.entries(expected)) {
    if (actual[name] !== value) {
      fail(`${filePath} has ${name}=${actual[name] ?? "missing"}; expected ${value}`);
    }
  }
}

function assertEditorConfig() {
  const lines = readFileSync(path.join(repositoryRoot, ".editorconfig"), "utf8").split(/\r?\n/);
  const sections = new Map();
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }

    const section = trimmed.match(/^\[([^\]]+)\]$/);
    if (section) {
      currentSection = section[1];
      sections.set(currentSection, new Map());
      continue;
    }

    const property = trimmed.match(/^([^=]+?)\s*=\s*(.+)$/);
    if (property && currentSection !== null) {
      sections.get(currentSection).set(property[1].trim().toLowerCase(), property[2].trim().toLowerCase());
    }
  }

  const expected = new Map([
    ["*", "lf"],
    ["*.bat", "crlf"],
    ["*.cmd", "crlf"],
  ]);
  if (!/^\s*root\s*=\s*true\s*$/im.test(lines.join("\n"))) {
    fail(".editorconfig must set root = true");
  }
  for (const [section, endOfLine] of expected) {
    if (sections.get(section)?.get("end_of_line") !== endOfLine) {
      fail(`.editorconfig section [${section}] must set end_of_line = ${endOfLine}`);
    }
  }
}

function countLineEndings(bytes) {
  let crlf = 0;
  let bareLf = 0;
  let bareCr = 0;

  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] === 0x0a) {
      if (index > 0 && bytes[index - 1] === 0x0d) {
        crlf += 1;
      } else {
        bareLf += 1;
      }
    } else if (bytes[index] === 0x0d && bytes[index + 1] !== 0x0a) {
      bareCr += 1;
    }
  }

  return { crlf, bareLf, bareCr };
}

function assertCleanCheckout() {
  const status = runGit(["status", "--porcelain", "--untracked-files=all"]).toString("utf8");
  if (status !== "") {
    fail(`checkout is not clean:\n${status}`);
  }
}

function getCommit(ref) {
  return runGit(["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]).toString("ascii").trim();
}

function getPngBlobsFromTree(ref) {
  const entries = splitNullTerminated(runGit(["ls-tree", "-r", "-z", "--full-tree", ref]));
  const pngBlobs = new Map();
  for (const entry of entries) {
    const separator = entry.indexOf("\t");
    if (separator < 0) {
      fail(`could not parse tree entry ${JSON.stringify(entry)}`);
    }

    const [mode, type, objectId] = entry.slice(0, separator).split(" ");
    const filePath = entry.slice(separator + 1);
    if (path.posix.extname(filePath).toLowerCase() === ".png") {
      if (type !== "blob" || (mode !== "100644" && mode !== "100755")) {
        fail(`${filePath} has unexpected PNG tree entry mode/type ${mode}/${type}`);
      }
      pngBlobs.set(filePath, { mode, objectId });
    }
  }
  return pngBlobs;
}

function assertPngsUnchangedFromBase(baseCommit, indexBlobs) {
  const basePngFiles = getPngBlobsFromTree(baseCommit);
  const indexPngFiles = new Map(
    [...indexBlobs]
      .filter(([filePath]) => path.posix.extname(filePath).toLowerCase() === ".png")
      .map(([filePath, { mode, objectId }]) => [filePath, { mode, objectId }]),
  );

  for (const [filePath, baseline] of basePngFiles) {
    const current = indexPngFiles.get(filePath);
    if (!current || current.objectId !== baseline.objectId || current.mode !== baseline.mode) {
      fail(`${filePath} PNG path, mode, or blob differs from base ${baseRef}`);
    }
  }
  for (const filePath of indexPngFiles.keys()) {
    if (!basePngFiles.has(filePath)) {
      fail(`${filePath} is a new PNG path absent from base ${baseRef}`);
    }
  }
  return basePngFiles.size;
}

const coreAutocrlf = getOptionalGitConfig("core.autocrlf") ?? "unset";

if (requireClean) {
  assertCleanCheckout();
}

const baseCommit = baseRef ? getCommit(baseRef) : null;

assertEditorConfig();

const indexEntries = splitNullTerminated(runGit(["ls-files", "--stage", "-z"]));
const indexBlobs = new Map();
for (const entry of indexEntries) {
  const separator = entry.indexOf("\t");
  if (separator < 0) {
    fail(`could not parse index entry ${JSON.stringify(entry)}`);
  }

  const [mode, objectId, stageText] = entry.slice(0, separator).split(" ");
  const filePath = entry.slice(separator + 1);
  if (stageText !== "0") {
    fail(`${filePath} has unexpected index stage ${stageText}`);
  }
  if (mode !== "100644" && mode !== "100755") {
    fail(`${filePath} has unexpected tracked mode ${mode}`);
  }
  if (filePath.includes("\n") || filePath.includes("\r")) {
    fail(`tracked path contains a newline and cannot be validated safely: ${JSON.stringify(filePath)}`);
  }
  indexBlobs.set(filePath, { mode, objectId });
}

const trackedPaths = [...indexBlobs.keys()];
if (trackedPaths.length === 0) {
  fail("the checkout has no tracked files");
}

const baselinePngFiles = baseCommit ? assertPngsUnchangedFromBase(baseCommit, indexBlobs) : null;

const attributes = getAttributes(trackedPaths);
const probes = ["__eol_policy_probe__.txt", "__eol_policy_probe__.bat", "__eol_policy_probe__.cmd"];
const probeAttributes = getAttributes(probes);
assertAttribute(probeAttributes, probes[0], { text: "auto", eol: "lf" });
assertAttribute(probeAttributes, probes[1], { text: "set", eol: "crlf" });
assertAttribute(probeAttributes, probes[2], { text: "set", eol: "crlf" });

const filteredHashes = runGit(
  ["hash-object", "--stdin-paths"],
  Buffer.from(`${trackedPaths.join("\n")}\n`, "utf8"),
)
  .toString("ascii")
  .trim()
  .split(/\r?\n/);
if (filteredHashes.length !== trackedPaths.length) {
  fail(`expected ${trackedPaths.length} filtered hashes, received ${filteredHashes.length}`);
}

let textFiles = 0;
let binaryFiles = 0;
let batchFiles = 0;
for (const [index, filePath] of trackedPaths.entries()) {
  const { objectId } = indexBlobs.get(filePath);
  if (filteredHashes[index] !== objectId) {
    fail(`${filePath} filtered worktree hash does not match its index blob`);
  }

  const fileAttributes = attributes.get(filePath);
  if (!fileAttributes) {
    fail(`missing Git attributes for ${filePath}`);
  }

  const bytes = readFileSync(path.join(repositoryRoot, filePath));
  const extension = path.posix.extname(filePath).toLowerCase();
  if (extension === ".png") {
    assertAttribute(attributes, filePath, { text: "unset" });
    const rawHash = runGit(["hash-object", "--no-filters", "--stdin"], bytes).toString("ascii").trim();
    if (rawHash !== objectId) {
      fail(`${filePath} raw binary blob hash does not match its index blob`);
    }
    binaryFiles += 1;
    continue;
  }

  const endings = countLineEndings(bytes);
  if (extension === ".bat" || extension === ".cmd") {
    assertAttribute(attributes, filePath, { text: "set", eol: "crlf" });
    if (endings.bareLf !== 0 || endings.bareCr !== 0) {
      fail(`${filePath} must use CRLF only; found bare LF or CR`);
    }
    batchFiles += 1;
    continue;
  }

  if (fileAttributes.text !== "auto" && fileAttributes.text !== "set") {
    fail(`${filePath} must be governed by the default text policy; found text=${fileAttributes.text}`);
  }
  if (fileAttributes.eol !== "lf") {
    fail(`${filePath} must have eol=lf; found eol=${fileAttributes.eol}`);
  }
  if (bytes.includes(0)) {
    fail(`${filePath} contains NUL but is not explicitly covered by a binary rule`);
  }
  if (endings.crlf !== 0 || endings.bareCr !== 0) {
    fail(`${filePath} must use LF only; found CRLF or bare CR`);
  }
  textFiles += 1;
}

if (requireClean) {
  assertCleanCheckout();
}

console.log(
  JSON.stringify(
    {
      success: true,
      platform: process.platform,
      coreAutocrlf,
      baseRef: baseRef ?? null,
      baseCommit,
      trackedFiles: trackedPaths.length,
      textFiles,
      binaryPngFiles: binaryFiles,
      baselinePngFiles,
      batchFiles,
      filteredHashesMatchIndex: true,
      cleanCheckoutRequired: requireClean,
    },
    null,
    2,
  ),
);
