import type { MediaData } from "./media.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";

export const mediaClassNames = [
  "c-media",
  "c-media__image",
  "c-media__caption",
] as const;

export const renderMedia = (
  data: MediaData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const imageUsage = data.size === "content" ? "media-content" : "media-wide";
  const resolvedImage = renderContext.resolveImage(data, imageUsage);
  const responsiveImage = renderContext.resolveResponsiveImage?.(data, imageUsage);
  const altText = data.alt ?? "";
  const intrinsicWidth = data.width ?? resolvedImage.width;
  const intrinsicHeight = data.height ?? resolvedImage.height;
  const intrinsicDimensions =
    intrinsicWidth !== undefined && intrinsicHeight !== undefined
      ? ` width="${intrinsicWidth}" height="${intrinsicHeight}"`
      : "";
  const srcsetAttribute =
    responsiveImage?.srcset ? ` srcset="${escapeHtml(responsiveImage.srcset)}"` : "";
  const sizesAttribute =
    responsiveImage?.sizes ? ` sizes="${escapeHtml(responsiveImage.sizes)}"` : "";
  const loadingAttribute = data.loading ? ` loading="${escapeHtml(data.loading)}"` : "";

  return [
    '<section class="c-media">',
    `  <img class="c-media__image" src="${escapeHtml(resolvedImage.src)}" alt="${escapeHtml(altText)}"${intrinsicDimensions}${srcsetAttribute}${sizesAttribute}${loadingAttribute} decoding="async" />`,
    data.caption ? `  <p class="c-media__caption">${escapeHtml(data.caption)}</p>` : "",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
