import { describe, expect, it, vi } from "vitest";

const fsPromisesMocks = vi.hoisted(() => ({
  writeFile: vi.fn(async () => undefined),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...actual,
    writeFile: fsPromisesMocks.writeFile,
  };
});

describe("renderSitePreview", () => {
  it("renders one page from in-memory site data without writing files", async () => {
    const { renderSitePreview } = await import("../src/build/framework.js");
    const { SiteContentSchema } = await import("../src/schemas/site.schema.js");
    const siteContent = SiteContentSchema.parse({
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
              title: "About LaunchKit",
              paragraphs: ["Theme-driven static pages without custom templates."],
            },
          ],
        },
      ],
    });

    const preview = await renderSitePreview(siteContent, "/about");

    expect(preview.slug).toBe("/about");
    expect(preview.html).toContain("About LaunchKit");
    expect(preview.html).not.toContain("Homepage gallery");
    expect(preview.html).toContain('<link rel="stylesheet" href="/assets/site.css" />');
    expect(preview.css).toContain("/* prose */");
    expect(preview.css).not.toContain("/* gallery */");
    expect(preview.js).toBeUndefined();
    expect(fsPromisesMocks.writeFile).not.toHaveBeenCalled();
  });

  it("fails clearly when the requested preview page does not exist", async () => {
    const { renderSitePreview } = await import("../src/build/framework.js");
    const { SiteContentSchema } = await import("../src/schemas/site.schema.js");
    const siteContent = SiteContentSchema.parse({
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
              type: "hero",
              headline: "Launch faster",
              primaryCta: {
                label: "Get started",
                href: "/start",
              },
            },
          ],
        },
      ],
    });

    await expect(renderSitePreview(siteContent, "/missing")).rejects.toThrow(
      "No page exists for slug '/missing'",
    );
  });
});
