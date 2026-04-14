import type { FeatureGridData } from "./feature-grid.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";

export const featureGridClassNames = [
  "c-feature-grid",
  "c-feature-grid__inner",
  "c-feature-grid__title",
  "c-feature-grid__lead",
  "c-feature-grid__items",
  "c-feature-grid__items--cols-1",
  "c-feature-grid__items--cols-2",
  "c-feature-grid__items--cols-3",
  "c-feature-grid__items--cols-4",
  "c-feature-grid__item",
  "c-feature-grid__item--has-image",
  "c-feature-grid__item--stacked-image",
  "c-feature-grid__item--compact",
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

export const renderFeatureGrid = (
  data: FeatureGridData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const itemsClasses = [
    "c-feature-grid__items",
    `c-feature-grid__items--cols-${data.columns}`,
  ];
  const itemsHtml = data.items
    .map(
      (item) => {
        const itemClasses = ["c-feature-grid__item"];
        const isCompact = !item.image && !item.body;

        if (item.image) {
          itemClasses.push("c-feature-grid__item--has-image");
        }

        if (item.imageLayout === "stacked") {
          itemClasses.push("c-feature-grid__item--stacked-image");
        }

        if (item.selected) {
          itemClasses.push("c-feature-grid__item--selected");
        }

        if (isCompact) {
          itemClasses.push("c-feature-grid__item--compact");
        }

        const resolvedImage = item.image
          ? renderContext.resolveImage(
              item.image,
              item.imageLayout === "stacked" ? "feature-grid-stacked" : "feature-grid-inline",
            )
          : undefined;
        const imageDimensions =
          resolvedImage?.width !== undefined && resolvedImage.height !== undefined
            ? ` width="${resolvedImage.width}" height="${resolvedImage.height}"`
            : "";

        return [
          `      <li class="${itemClasses.join(" ")}">`,
          item.image
            ? [
                '        <figure class="c-feature-grid__item-media">',
                `          <img class="c-feature-grid__item-image" src="${escapeHtml(resolvedImage?.src ?? item.image.src)}" alt="${escapeHtml(item.image.alt)}"${imageDimensions} />`,
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
          item.body
            ? `          <p class="c-feature-grid__item-body">${escapeHtml(item.body)}</p>`
            : "",
          item.selected
            ? '          <p class="c-feature-grid__item-status" aria-current="page">Current selection</p>'
            : "",
          item.cta
            ? (() => {
                const targetAttribute = item.cta.target
                  ? ` target="${escapeHtml(item.cta.target)}"`
                  : "";
                const relAttribute =
                  item.cta.target === "_blank" ? ' rel="noopener noreferrer"' : "";

                return `          <a class="c-feature-grid__item-cta c-button c-button--secondary" href="${escapeHtml(item.cta.href)}"${targetAttribute}${relAttribute}>${escapeHtml(item.cta.label)}</a>`;
              })()
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
    data.lead ? `    <p class="c-feature-grid__lead">${escapeHtml(data.lead)}</p>` : "",
    `    <ul class="${itemsClasses.join(" ")}">`,
    itemsHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
