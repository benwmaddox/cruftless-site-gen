import type { CtaBandData } from "./cta-band.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const ctaBandClassNames = [
  "c-cta-band",
  "c-cta-band__inner",
  "c-cta-band__headline",
  "c-cta-band__body",
  "c-cta-band__actions",
] as const;

export const renderCtaBand = (data: CtaBandData): string => {
  const ctas = [data.primaryCta, data.secondaryCta].filter(
    (cta): cta is NonNullable<typeof cta> => Boolean(cta),
  );

  const actionsHtml = ctas
    .map((cta, index) => {
      const variant = index === 0 ? "primary" : "secondary";

      return `<a class="c-button c-button--${variant}" href="${escapeHtml(
        cta.href,
      )}">${escapeHtml(cta.label)}</a>`;
    })
    .join("");

  return [
    '<section class="c-cta-band l-section">',
    '  <div class="c-cta-band__inner">',
    `    <h2 class="c-cta-band__headline">${escapeHtml(data.headline)}</h2>`,
    data.body
      ? `    <p class="c-cta-band__body">${escapeHtml(data.body)}</p>`
      : "",
    `    <div class="c-cta-band__actions">${actionsHtml}</div>`,
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
