import { describe, expect, it } from "vitest";

import { renderGallery } from "./gallery.render.js";
import { GallerySchema } from "./gallery.schema.js";
import type { ComponentRenderContext } from "../render-context.js";

describe("GallerySchema", () => {
  it("accepts gallery content and renders a configurable photo grid", () => {
    const parsed = GallerySchema.parse({
      type: "gallery",
      title: "Recent project photography",
      lead: "Use a photo grid when the redesign needs repeated visual proof.",
      columns: "4",
      images: [
        {
          src: "https://images.example.com/project-1.jpg",
          alt: "Front lobby with new built-in seating",
          caption: "Entry lobby refresh",
        },
        {
          src: "https://images.example.com/project-2.jpg",
          alt: "Renovated conference room with daylight",
          caption: "Conference room upgrade",
        },
      ],
    });

    const html = renderGallery(parsed);

    expect(html).toContain('<section class="c-gallery" data-js="gallery" data-gallery-open="false">');
    expect(html).toContain("c-gallery__items--columns-4");
    expect(html).toContain('class="c-gallery__trigger"');
    expect(html).toContain('class="c-gallery__dialog" hidden');
    expect(html).toContain("Entry lobby refresh");
  });

  it("renders resolved thumbnail and full-size image references when provided", () => {
    const parsed = GallerySchema.parse({
      type: "gallery",
      title: "Project photography",
      columns: "3",
      images: [
        {
          src: "content/images/project-1.jpg",
          alt: "Remodeled showroom",
          caption: "Showroom",
        },
        {
          src: "content/images/project-1.jpg",
          alt: "Remodeled showroom detail",
        },
      ],
    });
    const renderContext: ComponentRenderContext = {
      resolveImage: (image) => image,
      resolveGalleryImage: () => ({
        src: "assets/images/project-1-gallery-thumb-3.jpg",
        width: 560,
        height: 420,
        fullSrc: "assets/images/project-1-gallery-full.jpg",
        fullWidth: 1600,
        fullHeight: 1200,
      }),
    };

    const html = renderGallery(parsed, renderContext);

    expect(html).toContain('src="assets/images/project-1-gallery-thumb-3.jpg"');
    expect(html).toContain('width="560" height="420"');
    expect(html).toContain('data-gallery-full-src="assets/images/project-1-gallery-full.jpg"');
  });

  it("rejects unsupported column counts", () => {
    const result = GallerySchema.safeParse({
      type: "gallery",
      title: "Recent project photography",
      columns: "5",
      images: [
        {
          src: "https://images.example.com/project-1.jpg",
          alt: "Front lobby with new built-in seating",
        },
        {
          src: "https://images.example.com/project-2.jpg",
          alt: "Renovated conference room with daylight",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "columns")).toBe(
      true,
    );
  });
});
