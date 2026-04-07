import { describe, expect, it } from "vitest";

import { renderGallery } from "./gallery.render.js";
import { GallerySchema } from "./gallery.schema.js";

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

    expect(html).toContain('<section class="c-gallery">');
    expect(html).toContain("c-gallery__items--columns-4");
    expect(html).toContain("Entry lobby refresh");
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
