import type { MediaData } from "./media.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const mediaClassNames = [
  "c-media",
  "c-media--size-content",
  "c-media--size-wide",
  "c-media__image",
  "c-media__caption",
] as const;

export const renderMedia = (data: MediaData): string => {
  if (!data.src || data.src.trim().length === 0) {
    return "";
  }

  const dimensions =
    data.width !== undefined && data.height !== undefined
      ? ` width="${data.width}" height="${data.height}"`
      : "";

  return [
    `<figure class="c-media c-media--size-${escapeHtml(data.size)}">`,
    `  <img class="c-media__image" src="${escapeHtml(data.src)}" alt="${escapeHtml(data.alt ?? "")}"${dimensions} />`,
    data.caption ? `  <figcaption class="c-media__caption">${escapeHtml(data.caption)}</figcaption>` : "",
    "</figure>",
  ]
    .filter(Boolean)
    .join("\n");
};
