import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";
import type { ImageTextData } from "./image-text.schema.js";

export const imageTextClassNames = [
  "c-image-text",
  "c-image-text__inner",
  "c-image-text__copy",
  "c-image-text__eyebrow",
  "c-image-text__title",
  "c-image-text__content",
  "c-image-text__paragraph",
  "c-image-text__actions",
  "c-image-text__media",
  "c-image-text__image",
  "c-image-text__caption",
] as const;

const renderAction = (
  cta: ImageTextData["primaryCta"] | ImageTextData["secondaryCta"],
  variant: "primary" | "secondary",
): string => {
  if (!cta) {
    return "";
  }

  return `<a class="c-button c-button--${variant}" href="${escapeHtml(cta.href)}">${escapeHtml(cta.label)}</a>`;
};

const renderCopy = (data: ImageTextData): string => {
  const paragraphsHtml = data.paragraphs
    .map(
      (paragraph) =>
        `      <p class="c-image-text__paragraph">${escapeHtml(paragraph)}</p>`,
    )
    .join("\n");
  const actionsHtml = [
    renderAction(data.primaryCta, "primary"),
    renderAction(data.secondaryCta, "secondary"),
  ]
    .filter(Boolean)
    .join("\n");

  return [
    '  <div class="c-image-text__copy">',
    data.eyebrow ? `    <p class="c-image-text__eyebrow">${escapeHtml(data.eyebrow)}</p>` : "",
    `    <h2 class="c-image-text__title">${escapeHtml(data.title)}</h2>`,
    '    <div class="c-image-text__content">',
    paragraphsHtml,
    "    </div>",
    actionsHtml ? `    <div class="c-image-text__actions">${actionsHtml}</div>` : "",
    "  </div>",
  ]
    .filter(Boolean)
    .join("\n");
};

const renderMedia = (data: ImageTextData, renderContext: ComponentRenderContext): string => {
  const resolvedImage = renderContext.resolveImage(data.image, "image-text");
  const dimensions =
    resolvedImage.width !== undefined && resolvedImage.height !== undefined
      ? ` width="${resolvedImage.width}" height="${resolvedImage.height}"`
      : "";

  return [
    '  <figure class="c-image-text__media">',
    `    <img class="c-image-text__image" src="${escapeHtml(resolvedImage.src)}" alt="${escapeHtml(data.image.alt)}"${dimensions} />`,
    data.image.caption
      ? `    <figcaption class="c-image-text__caption">${escapeHtml(data.image.caption)}</figcaption>`
      : "",
    "  </figure>",
  ]
    .filter(Boolean)
    .join("\n");
};

export const renderImageText = (
  data: ImageTextData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const innerHtml =
    data.imagePosition === "start"
      ? [renderMedia(data, renderContext), renderCopy(data)].join("\n")
      : [renderCopy(data), renderMedia(data, renderContext)].join("\n");

  return [
    `<section class="c-image-text l-section c-image-text--image-${escapeHtml(data.imagePosition)}">`,
    '  <div class="c-image-text__inner">',
    innerHtml,
    "  </div>",
    "</section>",
  ].join("\n");
};
