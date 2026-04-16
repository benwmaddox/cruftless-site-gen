import { escapeHtml } from "../../renderer/escape-html.js";
import type { GoogleMapsData } from "./google-maps.schema.js";

export const googleMapsClassNames = [
  "c-google-maps",
  "c-google-maps--size-content",
  "c-google-maps--size-wide",
  "c-google-maps__frame",
  "c-google-maps__embed",
  "c-google-maps__caption",
] as const;

export const renderGoogleMaps = (data: GoogleMapsData): string => {
  return [
    `<section class="c-google-maps l-section c-google-maps--size-${escapeHtml(data.size)}">`,
    '  <div class="c-google-maps__frame l-item">',
    `    <iframe class="c-google-maps__embed" src="${escapeHtml(data.embedUrl)}" title="${escapeHtml(data.title)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`,
    "  </div>",
    data.caption
      ? `  <p class="c-google-maps__caption">${escapeHtml(data.caption)}</p>`
      : "",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
