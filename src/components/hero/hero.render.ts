import type { HeroData } from "./hero.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";

const escapeCssSingleQuotedString = (value: string): string =>
  value
    .replace(/\\/gu, "\\\\")
    .replace(/'/gu, "\\'")
    .replace(/[\n\r\f]/gu, "");

export const heroClassNames = [
  "c-hero",
  "c-hero--has-background",
  "c-hero--align-start",
  "c-hero--align-center",
  "c-hero__body",
  "c-hero__headline",
  "c-hero__subheadline",
  "c-hero__actions",
] as const;

export const renderHero = (
  data: HeroData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const ctas = [data.primaryCta, data.secondaryCta, ...(data.additionalCtas ?? [])].filter(
    (cta): cta is NonNullable<typeof cta> => Boolean(cta),
  );
  const className = [
    "c-hero",
    "l-container",
    "l-section",
    "l-section--hero",
    `c-hero--align-${escapeHtml(data.align)}`,
    data.backgroundImage ? "c-hero--has-background" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const resolvedBackgroundImage = data.backgroundImage
    ? renderContext.resolveImage(data.backgroundImage, "hero-background")
    : undefined;
  const backgroundStyle = data.backgroundImage && resolvedBackgroundImage
    ? ` style="background-image: linear-gradient(90deg, rgb(0 0 0 / 72%), rgb(0 0 0 / 38%) 54%, rgb(0 0 0 / 18%)), url('${escapeHtml(
        escapeCssSingleQuotedString(resolvedBackgroundImage.src),
      )}'); background-position: center, ${escapeHtml(data.backgroundImage.position)}; background-size: auto, cover; background-repeat: no-repeat;"`
    : "";

  const actionHtml = ctas
    .map((cta, index) => {
      const variant = index === 0 ? "primary" : "secondary";

      return `<a class="c-button c-button--${variant}" href="${escapeHtml(
        cta.href,
      )}">${escapeHtml(cta.label)}</a>`;
    })
    .join("");

  return [
    `<section class="${className}"${backgroundStyle}>`,
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
