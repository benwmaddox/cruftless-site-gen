import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";
import type { TestimonialsData } from "./testimonials.schema.js";

export const testimonialsClassNames = [
  "c-testimonials",
  "c-testimonials__inner",
  "c-testimonials__title",
  "c-testimonials__lead",
  "c-testimonials__items",
  "c-testimonials__item",
  "c-testimonials__quote",
  "c-testimonials__footer",
  "c-testimonials__avatar",
  "c-testimonials__person",
  "c-testimonials__name",
  "c-testimonials__meta",
] as const;

const renderMeta = (item: TestimonialsData["items"][number]): string => {
  const parts = [item.role, item.company].filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return `<p class="c-testimonials__meta">${escapeHtml(parts.join(", "))}</p>`;
};

const renderAvatar = (
  image: TestimonialsData["items"][number]["image"],
  renderContext: ComponentRenderContext,
): string => {
  if (!image) {
    return "";
  }

  const resolvedImage = renderContext.resolveImage(image, "testimonial-avatar");
  const dimensions =
    resolvedImage.width !== undefined && resolvedImage.height !== undefined
      ? ` width="${resolvedImage.width}" height="${resolvedImage.height}"`
      : "";

  return `<img class="c-testimonials__avatar" src="${escapeHtml(resolvedImage.src)}" alt="${escapeHtml(image.alt)}"${dimensions} />`;
};

export const renderTestimonials = (
  data: TestimonialsData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const itemsHtml = data.items
    .map((item) =>
      [
        '      <li class="c-testimonials__item l-item">',
        `        <blockquote class="c-testimonials__quote">&ldquo;${escapeHtml(item.quote)}&rdquo;</blockquote>`,
        '        <div class="c-testimonials__footer">',
        renderAvatar(item.image, renderContext),
        '          <div class="c-testimonials__person">',
        `            <p class="c-testimonials__name">${escapeHtml(item.name)}</p>`,
        renderMeta(item),
        "          </div>",
        "        </div>",
        "      </li>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return [
    '<section class="c-testimonials l-container l-section">',
    '  <div class="c-testimonials__inner">',
    `    <h2 class="c-testimonials__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-testimonials__lead">${escapeHtml(data.lead)}</p>` : "",
    '    <ul class="c-testimonials__items">',
    itemsHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
