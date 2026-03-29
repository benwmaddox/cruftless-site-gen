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
  return [
    `<figure class="c-media c-media--size-${escapeHtml(data.size)}">`,
    `  <img class="c-media__image" src="${escapeHtml(data.src)}" alt="${escapeHtml(data.alt)}" />`,
    data.caption ? `  <figcaption class="c-media__caption">${escapeHtml(data.caption)}</figcaption>` : "",
    "</figure>",
  ]
    .filter(Boolean)
    .join("\n");
};
