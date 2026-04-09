import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";
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
  "c-gallery__trigger",
  "c-gallery__image",
  "c-gallery__caption",
  "c-gallery__dialog",
  "c-gallery__dialog-inner",
  "c-gallery__dialog-close",
  "c-gallery__dialog-image",
  "c-gallery__dialog-caption",
] as const;

export const renderGallery = (
  data: GalleryData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const imagesHtml = data.images
    .map((image) => {
      const resolvedImage = renderContext.resolveGalleryImage(image, data.columns);
      const dimensions =
        resolvedImage.width !== undefined && resolvedImage.height !== undefined
          ? ` width="${resolvedImage.width}" height="${resolvedImage.height}"`
          : "";

      return [
        '      <li class="c-gallery__item">',
        '        <figure class="c-gallery__figure">',
        `          <button class="c-gallery__trigger" type="button" data-gallery-full-src="${escapeHtml(resolvedImage.fullSrc ?? resolvedImage.src)}" data-gallery-alt="${escapeHtml(image.alt)}" data-gallery-caption="${escapeHtml(image.caption ?? "")}">`,
        `            <img class="c-gallery__image" src="${escapeHtml(resolvedImage.src)}" alt="${escapeHtml(image.alt)}"${dimensions} />`,
        "          </button>",
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
    '<section class="c-gallery" data-js="gallery" data-gallery-open="false">',
    '  <div class="c-gallery__inner">',
    `    <h2 class="c-gallery__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-gallery__lead">${escapeHtml(data.lead)}</p>` : "",
    `    <ul class="c-gallery__items c-gallery__items--columns-${escapeHtml(data.columns)}">`,
    imagesHtml,
    "    </ul>",
    '    <div class="c-gallery__dialog" hidden>',
    '      <div class="c-gallery__dialog-inner">',
    '        <button class="c-gallery__dialog-close c-button c-button--secondary" type="button" aria-label="Close gallery image">Close</button>',
    '        <img class="c-gallery__dialog-image" alt="" />',
    '        <p class="c-gallery__dialog-caption"></p>',
    "      </div>",
    "    </div>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
