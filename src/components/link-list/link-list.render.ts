import { escapeHtml } from "../../renderer/escape-html.js";
import type { LinkListData } from "./link-list.schema.js";

export const linkListClassNames = [
  "c-link-list",
  "c-link-list__inner",
  "c-link-list__title",
  "c-link-list__lead",
  "c-link-list__links",
  "c-link-list__item",
  "c-link-list__link",
  "c-link-list__link--current",
] as const;

export const renderLinkList = (data: LinkListData): string => {
  const linksHtml = data.links
    .map((link) =>
      [
        '      <li class="c-link-list__item">',
        link.current
          ? `        <span class="c-button c-button--primary c-link-list__link c-link-list__link--current" aria-current="page">${escapeHtml(link.label)}</span>`
          : `        <a class="c-button c-button--secondary c-link-list__link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`,
        "      </li>",
      ].join("\n"),
    )
    .join("\n");

  return [
    '<section class="c-link-list">',
    '  <div class="c-link-list__inner">',
    `    <h2 class="c-link-list__title">${escapeHtml(data.title)}</h2>`,
    data.lead ? `    <p class="c-link-list__lead">${escapeHtml(data.lead)}</p>` : "",
    '    <ul class="c-link-list__links">',
    linksHtml,
    "    </ul>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
