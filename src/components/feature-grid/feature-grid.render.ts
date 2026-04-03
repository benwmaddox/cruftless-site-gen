import type { FeatureGridData } from "./feature-grid.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const featureGridClassNames = [
  "c-feature-grid",
  "c-feature-grid__inner",
  "c-feature-grid__title",
  "c-feature-grid__items",
  "c-feature-grid__item",
  "c-feature-grid__item--has-image",
  "c-feature-grid__item--stacked-image",
  "c-feature-grid__item--selected",
  "c-feature-grid__item-media",
  "c-feature-grid__item-image",
  "c-feature-grid__item-caption",
  "c-feature-grid__item-copy",
  "c-feature-grid__item-title",
  "c-feature-grid__item-body",
  "c-feature-grid__item-status",
  "c-feature-grid__item-cta",
] as const;

export const renderFeatureGrid = (data: FeatureGridData): string => {
  const itemsHtml = data.items
    .map(
      (item) => {
        const itemClasses = ["c-feature-grid__item"];

        if (item.image) {
          itemClasses.push("c-feature-grid__item--has-image");
        }

        if (item.imageLayout === "stacked") {
          itemClasses.push("c-feature-grid__item--stacked-image");
        }

        if (item.selected) {
          itemClasses.push("c-feature-grid__item--selected");
        }

        const imageDimensions =
          item.image?.width !== undefined && item.image.height !== undefined
            ? ` width="${item.image.width}" height="${item.image.height}"`
            : "";

        return [
          `      <li class="${itemClasses.join(" ")}">`,
          item.image
            ? [
                '        <figure class="c-feature-grid__item-media">',
                `          <img class="c-feature-grid__item-image" src="${escapeHtml(item.image.src)}" alt="${escapeHtml(item.image.alt)}"${imageDimensions} />`,
                item.image.caption
                  ? `          <figcaption class="c-feature-grid__item-caption">${escapeHtml(item.image.caption)}</figcaption>`
                  : "",
                "        </figure>",
              ]
                .filter(Boolean)
                .join("\n")
            : "",
          '        <div class="c-feature-grid__item-copy">',
          `          <h3 class="c-feature-grid__item-title">${escapeHtml(item.title)}</h3>`,
          `          <p class="c-feature-grid__item-body">${escapeHtml(item.body)}</p>`,
          item.selected
            ? '          <p class="c-feature-grid__item-status" aria-current="page">Current selection</p>'
            : "",
          item.cta
            ? `          <a class="c-feature-grid__item-cta c-button c-button--secondary" href="${escapeHtml(item.cta.href)}">${escapeHtml(item.cta.label)}</a>`
            : "",
          "        </div>",
          "      </li>",
        ]
          .filter(Boolean)
          .join("\n");
      },
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
