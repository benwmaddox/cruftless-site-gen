import { escapeHtml } from "../../renderer/escape-html.js";
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "../render-context.js";
import type { NavigationBarData } from "./navigation-bar.schema.js";

export const navigationBarClassNames = [
  "c-navbar",
  "c-navbar__inner",
  "c-navbar__brand",
  "c-navbar__brand-image",
  "c-navbar__brand-text",
  "c-navbar__controls",
  "c-navbar__inline-nav",
  "c-navbar__menu-button",
  "c-navbar__menu-label",
  "c-navbar__menu-icon",
  "c-navbar__panel",
  "c-navbar__measure",
  "c-navbar__list",
  "c-navbar__link",
] as const;

const renderLinkList = (links: NavigationBarData["links"]): string =>
  links
    .map(
      (link) =>
        `<li><a class="c-navbar__link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("");

const renderMeasureLinkList = (links: NavigationBarData["links"]): string =>
  links
    .map((link) => `<li><span class="c-navbar__link">${escapeHtml(link.label)}</span></li>`)
    .join("");

const createPanelId = (data: NavigationBarData): string => {
  const seed = JSON.stringify({
    brandText: data.brandText,
    brandImage: data.brandImage?.src,
    links: data.links,
  });
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return `c-navbar-panel-${hash.toString(36)}`;
};

export const renderNavigationBar = (
  data: NavigationBarData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  const panelId = createPanelId(data);
  const resolvedBrandImage = data.brandImage
    ? renderContext.resolveImage(data.brandImage, "navbar-brand")
    : undefined;
  const brandImageDimensions =
    resolvedBrandImage?.width !== undefined && resolvedBrandImage.height !== undefined
      ? ` width="${resolvedBrandImage.width}" height="${resolvedBrandImage.height}"`
      : "";
  const brandParts = [
    data.brandImage
      ? `<img class="c-navbar__brand-image" src="${escapeHtml(resolvedBrandImage?.src ?? data.brandImage.src)}" alt="${escapeHtml(data.brandImage.alt)}"${brandImageDimensions} />`
      : "",
    data.brandText ? `<span class="c-navbar__brand-text">${escapeHtml(data.brandText)}</span>` : "",
  ]
    .filter(Boolean)
    .join("");
  const brandHtml = brandParts ? `<a class="c-navbar__brand" href="/">${brandParts}</a>` : "";
  const linksHtml = renderLinkList(data.links);
  const measureLinksHtml = renderMeasureLinkList(data.links);

  return [
    '<header class="c-navbar" data-js="navigation-bar" data-navigation-bar-mode="inline" data-navigation-bar-open="false">',
    '  <div class="c-navbar__inner">',
    brandHtml ? `    ${brandHtml}` : "",
    '    <div class="c-navbar__controls">',
    `      <nav class="c-navbar__inline-nav" aria-label="Primary"><ul class="c-navbar__list">${linksHtml}</ul></nav>`,
    `      <button class="c-navbar__menu-button" type="button" aria-expanded="false" aria-controls="${escapeHtml(panelId)}">`,
    '        <span class="c-navbar__menu-label">Menu</span>',
    '        <span class="c-navbar__menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>',
    "      </button>",
    `      <nav class="c-navbar__measure" aria-hidden="true"><ul class="c-navbar__list">${measureLinksHtml}</ul></nav>`,
    "    </div>",
    "  </div>",
    `  <nav class="c-navbar__panel" id="${escapeHtml(panelId)}" aria-label="Menu" hidden><ul class="c-navbar__list">${linksHtml}</ul></nav>`,
    "</header>",
  ]
    .filter(Boolean)
    .join("\n");
};
