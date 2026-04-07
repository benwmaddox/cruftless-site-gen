import { escapeHtml } from "../../renderer/escape-html.js";
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

const renderAvatar = (image: TestimonialsData["items"][number]["image"]): string => {
  if (!image) {
    return "";
  }

  const dimensions =
    image.width !== undefined && image.height !== undefined
      ? ` width="${image.width}" height="${image.height}"`
      : "";

  return `<img class="c-testimonials__avatar" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}"${dimensions} />`;
};

export const renderTestimonials = (data: TestimonialsData): string => {
  const itemsHtml = data.items
    .map((item) =>
      [
        '      <li class="c-testimonials__item">',
        `        <blockquote class="c-testimonials__quote">&ldquo;${escapeHtml(item.quote)}&rdquo;</blockquote>`,
        '        <div class="c-testimonials__footer">',
        renderAvatar(item.image),
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
    '<section class="c-testimonials">',
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
