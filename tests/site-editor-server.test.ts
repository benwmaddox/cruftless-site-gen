import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createSiteEditorServer, type SiteEditorServer } from "../src/editor/site-editor-server.js";
import { SiteContentSchema, type SiteContentData } from "../src/schemas/site.schema.js";

const servers: SiteEditorServer[] = [];

const createDraft = (name: string, title = "About LaunchKit"): SiteContentData =>
  SiteContentSchema.parse({
    site: {
      name,
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
            headline: `${name} home`,
            primaryCta: {
              label: "Start",
              href: "/start",
            },
          },
        ],
      },
      {
        slug: "/about",
        title: "About",
        components: [
          {
            type: "prose",
            title,
            paragraphs: ["Theme-driven static pages without custom templates."],
          },
        ],
      },
    ],
  });

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const createServer = async (contentPath: string): Promise<SiteEditorServer> => {
  const server = await createSiteEditorServer({ contentPath });
  servers.push(server);
  return server;
};

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("createSiteEditorServer", () => {
  it("serves a user-facing editor and browses JSON files from the current directory", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    await writeJson(path.join(tempDir, "site.json"), createDraft("LaunchKit"));
    await writeJson(path.join(tempDir, "examples", "baird.json"), createDraft("Baird"));
    await mkdir(path.join(tempDir, "assets"), { recursive: true });
    await writeFile(path.join(tempDir, "assets", "mark.svg"), "<svg><title>Mark</title></svg>\n", "utf8");
    await writeFile(path.join(tempDir, "notes.json"), "{\"hello\": true}\n", "utf8");
    const server = await createServer(tempDir);

    const htmlResponse = await fetch(server.origin);
    const html = await htmlResponse.text();
    const filesResponse = await fetch(`${server.origin}/__editor/files`);
    const filesPayload = await filesResponse.json() as {
      directories: { name: string; path: string }[];
      directory: string;
      files: { name: string; path: string; valid: boolean; siteName?: string }[];
      parentDirectory?: string;
      selectedFile: string;
    };
    const assetResponse = await fetch(`${server.origin}/content/assets/mark.svg`);
    const assetBody = await assetResponse.text();

    expect(htmlResponse.status).toBe(200);
    expect(html).toContain("Cruftless Content Editor");
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.headers.get("content-type")).toContain("image/svg+xml");
    expect(assetBody).toContain("<title>Mark</title>");
    expect(filesPayload.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "site.json", valid: true, siteName: "LaunchKit" }),
        expect.objectContaining({ name: "notes.json", valid: false }),
      ]),
    );
    expect(filesPayload.files).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "baird.json" }),
      ]),
    );
    expect(filesPayload.directories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "assets" }),
        expect.objectContaining({ name: "examples" }),
      ]),
    );
    expect(filesPayload.directory).toBe(tempDir);
    expect(filesPayload.selectedFile).toBe(path.join(tempDir, "site.json"));
  });

  it("lets you browse above the current content root, filters sibling project directories, and snaps into nested content", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    const firstProjectDir = path.join(tempDir, "first");
    const firstContentDir = path.join(firstProjectDir, "content");
    const siblingProjectDir = path.join(tempDir, "sibling");
    const siblingContentDir = path.join(siblingProjectDir, "nested", "content");
    const unrelatedDir = path.join(tempDir, "notes-only");
    const siblingPath = path.join(siblingContentDir, "site.json");
    await writeJson(path.join(firstContentDir, "site.json"), createDraft("First"));
    await writeJson(siblingPath, createDraft("Sibling"));
    await mkdir(unrelatedDir, { recursive: true });
    const server = await createServer(firstContentDir);

    const projectResponse = await fetch(`${server.origin}/__editor/open-directory`, {
      body: JSON.stringify({ path: firstProjectDir, snapToContent: false }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const projectPayload = await projectResponse.json() as {
      directory: string;
      directories: { name: string; path: string; snapToContent: boolean }[];
      parentDirectory?: string;
    };
    const parentResponse = await fetch(`${server.origin}/__editor/open-directory`, {
      body: JSON.stringify({ path: tempDir, snapToContent: false }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const parentPayload = await parentResponse.json() as {
      directory: string;
      directories: { name: string; path: string; snapToContent: boolean }[];
    };
    const siblingResponse = await fetch(`${server.origin}/__editor/open-directory`, {
      body: JSON.stringify({ path: siblingProjectDir, snapToContent: "nested" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const siblingPayload = await siblingResponse.json() as {
      directory: string;
      files: { name: string; valid: boolean; siteName?: string }[];
    };
    const openResponse = await fetch(`${server.origin}/__editor/open`, {
      body: JSON.stringify({ path: siblingPath }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const openPayload = await openResponse.json() as {
      draft: SiteContentData;
      path: string;
    };

    expect(projectResponse.status).toBe(200);
    expect(projectPayload.directory).toBe(firstProjectDir);
    expect(projectPayload.parentDirectory).toBe(tempDir);
    expect(projectPayload.directories).toEqual([
      expect.objectContaining({
        name: "content",
        path: firstContentDir,
        snapToContent: true,
      }),
    ]);
    expect(parentResponse.status).toBe(200);
    expect(parentPayload.directory).toBe(tempDir);
    expect(parentPayload.directories).toEqual([
      expect.objectContaining({
        name: "first",
        path: firstProjectDir,
        snapToContent: true,
      }),
      expect.objectContaining({
        name: "sibling",
        path: siblingProjectDir,
        snapToContent: true,
      }),
    ]);
    expect(parentPayload.directories).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: path.basename(unrelatedDir) }),
      ]),
    );
    expect(siblingResponse.status).toBe(200);
    expect(siblingPayload.directory).toBe(siblingContentDir);
    expect(siblingPayload.files).toEqual([
      expect.objectContaining({ name: "site.json", valid: true, siteName: "Sibling" }),
    ]);
    expect(openResponse.status).toBe(200);
    expect(openPayload.draft.site.name).toBe("Sibling");
    expect(openPayload.path).toBe(siblingPath);
    expect(server.getSelectedFilePath()).toBe(siblingPath);
  });

  it("does not jump into the first nested content tree when a broad directory is opened directly", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    const broadDir = path.join(tempDir, "refreshes");
    const firstContentDir = path.join(broadDir, "first", "content");
    const siblingContentDir = path.join(broadDir, "sibling", "nested", "content");
    await writeJson(path.join(firstContentDir, "site.json"), createDraft("First"));
    await writeJson(path.join(siblingContentDir, "site.json"), createDraft("Sibling"));
    const server = await createServer(firstContentDir);

    const response = await fetch(`${server.origin}/__editor/open-directory`, {
      body: JSON.stringify({ path: tempDir, snapToContent: "direct" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = await response.json() as {
      directory: string;
      directories: { name: string; path: string; snapToContent: boolean }[];
    };
    const broadResponse = await fetch(`${server.origin}/__editor/open-directory`, {
      body: JSON.stringify({ path: broadDir, snapToContent: "none" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const broadPayload = await broadResponse.json() as {
      directory: string;
      directories: { name: string; path: string; snapToContent: boolean }[];
    };

    expect(response.status).toBe(200);
    expect(payload.directory).toBe(tempDir);
    expect(payload.directories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "refreshes", snapToContent: false }),
      ]),
    );
    expect(broadResponse.status).toBe(200);
    expect(broadPayload.directory).toBe(broadDir);
    expect(broadPayload.directories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "first", snapToContent: true }),
        expect.objectContaining({ name: "sibling", snapToContent: true }),
      ]),
    );
  });

  it("lists media files from the current content folder and nested subdirectories", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    const imagePath = path.join(tempDir, "images", "hero image.jpg");
    const logoPath = path.join(tempDir, "logos", "mark.svg");
    const videoPath = path.join(tempDir, "videos", "intro.mp4");
    await writeJson(path.join(tempDir, "site.json"), createDraft("LaunchKit"));
    await mkdir(path.dirname(imagePath), { recursive: true });
    await mkdir(path.dirname(logoPath), { recursive: true });
    await mkdir(path.dirname(videoPath), { recursive: true });
    await writeFile(imagePath, "jpg\n", "utf8");
    await writeFile(logoPath, "<svg />\n", "utf8");
    await writeFile(videoPath, "mp4\n", "utf8");
    await writeFile(path.join(tempDir, "notes.txt"), "ignore\n", "utf8");
    const server = await createServer(tempDir);

    const response = await fetch(
      `${server.origin}/__editor/media?directory=${encodeURIComponent(tempDir)}`,
    );
    const payload = await response.json() as {
      directory: string;
      files: { href: string; kind: string; relativePath: string }[];
    };

    expect(response.status).toBe(200);
    expect(payload.directory).toBe(tempDir);
    expect(payload.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: "/content/images/hero%20image.jpg",
          kind: "image",
          relativePath: "images/hero image.jpg",
        }),
        expect.objectContaining({
          href: "/content/logos/mark.svg",
          kind: "image",
          relativePath: "logos/mark.svg",
        }),
        expect.objectContaining({
          href: "/content/videos/intro.mp4",
          kind: "video",
          relativePath: "videos/intro.mp4",
        }),
      ]),
    );
    expect(payload.files).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relativePath: "notes.txt" }),
      ]),
    );
  });

  it("returns structured validation issues for invalid draft updates", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    await writeJson(path.join(tempDir, "site.json"), createDraft("LaunchKit"));
    const server = await createServer(tempDir);
    const invalidDraft = createDraft("LaunchKit");
    invalidDraft.site.name = "L".repeat(81);

    const response = await fetch(`${server.origin}/__preview/draft`, {
      body: JSON.stringify(invalidDraft),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = await response.json() as {
      error: string;
      issues?: { message: string; path: (string | number)[] }[];
    };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid site content");
    expect(payload.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["site", "name"],
        }),
      ]),
    );
  });

  it("opens, previews, drafts, and saves a selected JSON file", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    const firstPath = path.join(tempDir, "site.json");
    const secondPath = path.join(tempDir, "examples", "baird.json");
    await writeJson(firstPath, createDraft("LaunchKit"));
    await writeJson(secondPath, createDraft("Baird", "About Baird"));
    const server = await createServer(tempDir);

    const openResponse = await fetch(`${server.origin}/__editor/open`, {
      body: JSON.stringify({ path: "site.json" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const openPayload = await openResponse.json() as { draft: SiteContentData };

    expect(openResponse.status).toBe(200);
    expect(openPayload.draft.site.name).toBe("LaunchKit");

    const updatedDraft = createDraft("LaunchKit", "Edited in browser");
    const draftResponse = await fetch(`${server.origin}/__preview/draft`, {
      body: JSON.stringify(updatedDraft),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const previewResponse = await fetch(
      `${server.origin}/__preview/page?slug=${encodeURIComponent("/about")}`,
    );
    const previewHtml = await previewResponse.text();

    expect(draftResponse.status).toBe(204);
    expect(previewHtml).toContain("Edited in browser");
    expect(await readFile(firstPath, "utf8")).not.toContain("Edited in browser");

    const saveResponse = await fetch(`${server.origin}/__editor/save`, {
      body: JSON.stringify(updatedDraft),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(saveResponse.status).toBe(200);
    expect(await readFile(firstPath, "utf8")).toContain("Edited in browser");
    expect(await readFile(secondPath, "utf8")).toContain("About Baird");
  });

  it("rejects path traversal when opening files", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-site-editor-"));
    await writeJson(path.join(tempDir, "site.json"), createDraft("LaunchKit"));
    const server = await createServer(tempDir);

    const response = await fetch(`${server.origin}/__editor/open`, {
      body: JSON.stringify({ path: "../site.json" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid content file path");
  });
});
