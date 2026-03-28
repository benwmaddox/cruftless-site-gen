import type { HeroData } from "./hero.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const heroClassNames = [
  "c-hero",
  "c-hero--align-start",
  "c-hero--align-center",
  "c-hero__body",
  "c-hero__headline",
  "c-hero__subheadline",
  "c-hero__actions",
] as const;

export const renderHero = (data: HeroData): string => {
  const ctas = [data.primaryCta, data.secondaryCta].filter(
    (cta): cta is NonNullable<typeof cta> => Boolean(cta),
  );

  const actionHtml = ctas
    .map((cta, index) => {
      const variant = index === 0 ? "primary" : "secondary";

      return `<a class="c-button c-button--${variant}" href="${escapeHtml(
        cta.href,
      )}">${escapeHtml(cta.label)}</a>`;
    })
    .join("");

  return [
    `<section class="c-hero c-hero--align-${escapeHtml(data.align)}">`,
    '  <div class="c-hero__body">',
    `    <h1 class="c-hero__headline">${escapeHtml(data.headline)}</h1>`,
    data.subheadline
      ? `    <p class="c-hero__subheadline">${escapeHtml(data.subheadline)}</p>`
      : "",
    `    <div class="c-hero__actions">${actionHtml}</div>`,
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};

