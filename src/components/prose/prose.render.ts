import type { ProseData } from "./prose.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const proseClassNames = [
  "c-prose",
  "c-prose__inner",
  "c-prose__title",
  "c-prose__lead",
  "c-prose__content",
  "c-prose__paragraph",
] as const;

export const renderProse = (data: ProseData): string => {
  const paragraphsHtml = data.paragraphs
    .map((paragraph) => `      <p class="c-prose__paragraph">${escapeHtml(paragraph)}</p>`)
    .join("\n");

  return [
    '<section class="c-prose l-section">',
    '  <div class="c-prose__inner">',
    data.title ? `    <h2 class="c-prose__title">${escapeHtml(data.title)}</h2>` : "",
    data.lead ? `    <p class="c-prose__lead">${escapeHtml(data.lead)}</p>` : "",
    '    <div class="c-prose__content">',
    paragraphsHtml,
    "    </div>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
