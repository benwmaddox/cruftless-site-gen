import type { FeatureGridData } from "./feature-grid.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const featureGridClassNames = [
  "c-feature-grid",
  "c-feature-grid__inner",
  "c-feature-grid__title",
  "c-feature-grid__items",
  "c-feature-grid__item",
  "c-feature-grid__item-title",
  "c-feature-grid__item-body",
] as const;

export const renderFeatureGrid = (data: FeatureGridData): string => {
  const itemsHtml = data.items
    .map(
      (item) => [
        '      <li class="c-feature-grid__item">',
        `        <h3 class="c-feature-grid__item-title">${escapeHtml(item.title)}</h3>`,
        `        <p class="c-feature-grid__item-body">${escapeHtml(item.body)}</p>`,
        "      </li>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<section class="c-feature-grid">',
    '  <div class="c-feature-grid__inner">',
    `    <h2 class="c-feature-grid__title">${escapeHtml(data.title)}</h2>`,
    '    <ul class="c-feature-grid__items">',
    itemsHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ].join("\n");
};

