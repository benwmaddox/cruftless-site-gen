import type { FeatureListData } from "./feature-list.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const featureListClassNames = [
  "c-feature-list",
  "c-feature-list__inner",
  "c-feature-list__title",
  "c-feature-list__items",
  "c-feature-list__item",
  "c-feature-list__item-title",
  "c-feature-list__item-body",
] as const;

export const renderFeatureList = (data: FeatureListData): string => {
  const itemsHtml = data.items
    .map(
      (item) => [
        '      <li class="c-feature-list__item">',
        `        <h3 class="c-feature-list__item-title">${escapeHtml(item.title)}</h3>`,
        `        <p class="c-feature-list__item-body">${escapeHtml(item.body)}</p>`,
        "      </li>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<section class="c-feature-list">',
    '  <div class="c-feature-list__inner">',
    `    <h2 class="c-feature-list__title">${escapeHtml(data.title)}</h2>`,
    '    <ol class="c-feature-list__items">',
    itemsHtml,
    "    </ol>",
    "  </div>",
    "</section>",
  ].join("\n");
};
