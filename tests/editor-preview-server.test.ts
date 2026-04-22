import { mkdtemp, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { createEditorPreviewServer } from "../src/build/editor-preview-server.js";
import { SiteContentSchema, type SiteContentData } from "../src/schemas/site.schema.js";

const createDraft = (aboutTitle = "About LaunchKit"): SiteContentData =>
  SiteContentSchema.parse({
    site: {
      name: "LaunchKit",
      baseUrl: "https://launchkit.example",
      theme: "friendly-modern",
    },
    pages: [
      {
        slug: "/",
        title: "Home",
        components: [
          {
            type: "gallery",
            title: "Homepage gallery",
            images: [
              {
                src: "https://launchkit.example/gallery.jpg",
                alt: "Gallery image",
              },
              {
                src: "https://launchkit.example/gallery-2.jpg",
                alt: "Second gallery image",
              },
            ],
          },
        ],
      },
      {
        slug: "/about",
        title: "About",
        components: [
          {
            type: "prose",
            title: aboutTitle,
            paragraphs: ["Theme-driven static pages without custom templates."],
          },
        ],
      },
      {
        slug: "/contact",
        title: "Contact",
        components: [
          {
            type: "contact-form",
            mode: "demo",
            title: "Contact us",
            action: "/contact",
            submitLabel: "Send",
          },
        ],
      },
    ],
  });

const expectMissingFile = async (filePath: string): Promise<void> => {
  await expect(stat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
};

describe("createEditorPreviewServer", () => {
  it("serves a page-scoped preview from memory without writing content JSON", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-editor-preview-"));
    const contentPath = path.join(tempDir, "site.json");
    const server = await createEditorPreviewServer(createDraft(), { contentPath });

    try {
      const response = await fetch(`${server.origin}/about/`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain("About LaunchKit");
      expect(html).not.toContain("Homepage gallery");
      expect(html).toContain("/__preview/assets/site.css?slug=%2Fabout");

      const cssResponse = await fetch(
        `${server.origin}/__preview/assets/site.css?slug=${encodeURIComponent("/about")}`,
      );
      const css = await cssResponse.text();

      expect(cssResponse.status).toBe(200);
      expect(css).toContain("/* prose */");
      expect(css).not.toContain("/* gallery */");

      const contactResponse = await fetch(`${server.origin}/contact`);
      const contactHtml = await contactResponse.text();

      expect(contactResponse.status).toBe(200);
      expect(contactHtml).toContain("/__preview/assets/site.js?slug=%2Fcontact");

      const scriptResponse = await fetch(
        `${server.origin}/__preview/assets/site.js?slug=${encodeURIComponent("/contact")}`,
      );
      const script = await scriptResponse.text();

      expect(scriptResponse.status).toBe(200);
      expect(script).toContain("setupDemoContactForms");
      await expectMissingFile(contentPath);
    } finally {
      await server.close();
    }
  });

  it("updates the in-memory draft over HTTP without saving it", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-editor-preview-"));
    const contentPath = path.join(tempDir, "site.json");
    const server = await createEditorPreviewServer(createDraft(), { contentPath });

    try {
      const updatedDraft = createDraft("Edited without save");
      const updateResponse = await fetch(`${server.origin}/__preview/draft`, {
        body: JSON.stringify(updatedDraft),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      expect(updateResponse.status).toBe(204);

      const response = await fetch(`${server.origin}/about`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain("Edited without save");
      expect(server.getDraft()).toEqual(updatedDraft);
      await expectMissingFile(contentPath);
    } finally {
      await server.close();
    }
  });

  it("writes content JSON only through the explicit save path", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cruftless-editor-preview-"));
    const contentPath = path.join(tempDir, "site.json");
    const server = await createEditorPreviewServer(createDraft(), { contentPath });

    try {
      const savedDraft = createDraft("Saved page settings");
      const saveResponse = await fetch(`${server.origin}/__preview/save`, {
        body: JSON.stringify(savedDraft),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      expect(saveResponse.status).toBe(204);
      expect(JSON.parse(await readFile(contentPath, "utf8"))).toEqual(savedDraft);
    } finally {
      await server.close();
    }
  });

  it("rejects draft updates that do not match the real site schema", async () => {
    const server = await createEditorPreviewServer(createDraft());

    try {
      const updateResponse = await fetch(`${server.origin}/__preview/draft`, {
        body: JSON.stringify({
          site: {
            name: "LaunchKit",
            baseUrl: "https://launchkit.example",
            theme: "friendly-modern",
          },
          pages: [],
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const message = await updateResponse.text();

      expect(updateResponse.status).toBe(400);
      expect(message).toContain("Invalid site draft");
      expect((await fetch(`${server.origin}/about`)).status).toBe(200);
    } finally {
      await server.close();
    }
  });
});
