import { escapeHtml } from "../../renderer/escape-html.js";
import type { BeforeAfterData } from "./before-after.schema.js";

export const beforeAfterClassNames = [
  "c-before-after",
  "c-before-after__inner",
  "c-before-after__title",
  "c-before-after__lead",
  "c-before-after__items",
  "c-before-after__item",
  "c-before-after__label",
  "c-before-after__image",
  "c-before-after__caption",
] as const;

const renderPanel = (
  panel: BeforeAfterData["before"],
  modifier: "before" | "after",
): string => {
  const dimensions =
    panel.width !== undefined && panel.height !== undefined
      ? ` width="${panel.width}" height="${panel.height}"`
      : "";

  return [
    `      <figure class="c-before-after__item c-before-after__item--${modifier}">`,
    `        <p class="c-before-after__label">${escapeHtml(panel.label)}</p>`,
    `        <img class="c-before-after__image" src="${escapeHtml(panel.src)}" alt="${escapeHtml(panel.alt)}"${dimensions} />`,
    panel.caption
      ? `        <figcaption class="c-before-after__caption">${escapeHtml(panel.caption)}</figcaption>`
      : "",
    "      </figure>",
  ]
    .filter(Boolean)
    .join("\n");
};

export const renderBeforeAfter = (data: BeforeAfterData): string =>
  [
    '<section class="c-before-after">',
    '  <div class="c-before-after__inner">',
    `    <h2 class="c-before-after__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-before-after__lead">${escapeHtml(data.lead)}</p>` : "",
    '    <div class="c-before-after__items">',
    renderPanel(data.before, "before"),
    renderPanel(data.after, "after"),
    "    </div>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
