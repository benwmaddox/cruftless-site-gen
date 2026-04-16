import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";
import type { LogoStripData } from "./logo-strip.schema.js";

export const logoStripClassNames = [
  "c-logo-strip",
  "c-logo-strip__inner",
  "c-logo-strip__title",
  "c-logo-strip__lead",
  "c-logo-strip__list",
  "c-logo-strip__item",
  "c-logo-strip__link",
  "c-logo-strip__image",
] as const;

const renderLogo = (
  logo: LogoStripData["logos"][number],
  renderContext: ComponentRenderContext,
): string => {
  const resolvedImage = renderContext.resolveImage(logo, "navbar-brand");
  const dimensions =
    resolvedImage.width !== undefined && resolvedImage.height !== undefined
      ? ` width="${resolvedImage.width}" height="${resolvedImage.height}"`
      : "";
  const imageHtml = `<img class="c-logo-strip__image" src="${escapeHtml(resolvedImage.src)}" alt="${escapeHtml(logo.alt)}"${dimensions} />`;

  return [
    '      <li class="c-logo-strip__item">',
    logo.href
      ? `        <a class="c-logo-strip__link l-item" href="${escapeHtml(logo.href)}">${imageHtml}</a>`
      : `        <div class="c-logo-strip__link l-item">${imageHtml}</div>`,
    "      </li>",
  ].join("\n");
};

export const renderLogoStrip = (
  data: LogoStripData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const logosHtml = data.logos.map((logo) => renderLogo(logo, renderContext)).join("\n");

  return [
    '<section class="c-logo-strip l-section">',
    '  <div class="c-logo-strip__inner">',
    `    <h2 class="c-logo-strip__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-logo-strip__lead">${escapeHtml(data.lead)}</p>` : "",
    '    <ul class="c-logo-strip__list">',
    logosHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
