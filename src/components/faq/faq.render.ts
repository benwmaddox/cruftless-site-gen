import type { FaqData } from "./faq.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const faqClassNames = [
  "c-faq",
  "c-faq__inner",
  "c-faq__title",
  "c-faq__items",
  "c-faq__item",
  "c-faq__question",
  "c-faq__answer",
] as const;

export const renderFaq = (data: FaqData): string => {
  const itemsHtml = data.items
    .map(
      (item) => [
        '      <details class="c-faq__item l-item">',
        `        <summary class="c-faq__question">${escapeHtml(item.question)}</summary>`,
        `        <p class="c-faq__answer">${escapeHtml(item.answer)}</p>`,
        "      </details>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<section class="c-faq l-section">',
    '  <div class="c-faq__inner">',
    `    <h2 class="c-faq__title">${escapeHtml(data.title)}</h2>`,
    '    <div class="c-faq__items">',
    itemsHtml,
    "    </div>",
    "  </div>",
    "</section>",
  ].join("\n");
};
