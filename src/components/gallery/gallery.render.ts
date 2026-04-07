import { escapeHtml } from "../../renderer/escape-html.js";
import type { GalleryData } from "./gallery.schema.js";

export const galleryClassNames = [
  "c-gallery",
  "c-gallery__inner",
  "c-gallery__title",
  "c-gallery__lead",
  "c-gallery__items",
  "c-gallery__items--columns-2",
  "c-gallery__items--columns-3",
  "c-gallery__items--columns-4",
  "c-gallery__item",
  "c-gallery__figure",
  "c-gallery__image",
  "c-gallery__caption",
] as const;

export const renderGallery = (data: GalleryData): string => {
  const imagesHtml = data.images
    .map((image) => {
      const dimensions =
        image.width !== undefined && image.height !== undefined
          ? ` width="${image.width}" height="${image.height}"`
          : "";

      return [
        '      <li class="c-gallery__item">',
        '        <figure class="c-gallery__figure">',
        `          <img class="c-gallery__image" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}"${dimensions} />`,
        image.caption
          ? `          <figcaption class="c-gallery__caption">${escapeHtml(image.caption)}</figcaption>`
          : "",
        "        </figure>",
        "      </li>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<section class="c-gallery">',
    '  <div class="c-gallery__inner">',
    `    <h2 class="c-gallery__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-gallery__lead">${escapeHtml(data.lead)}</p>` : "",
    `    <ul class="c-gallery__items c-gallery__items--columns-${escapeHtml(data.columns)}">`,
    imagesHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
