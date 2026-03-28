import type { PageData, SiteData } from "../schemas/site.schema.js";
import { escapeHtml } from "./escape-html.js";

export const renderPageDocument = ({
  site,
  page,
  bodyHtml,
  stylesheetHref,
}: {
  site: SiteData;
  page: PageData;
  bodyHtml: string;
  stylesheetHref: string;
}): string => {
  const title =
    page.slug === "/" ? escapeHtml(site.name) : `${escapeHtml(page.title)} | ${escapeHtml(site.name)}`;
  const description = page.metadata?.description
    ? `<meta name="description" content="${escapeHtml(page.metadata.description)}" />`
    : "";
  const canonicalUrl = page.metadata?.canonicalUrl ?? new URL(page.slug, site.baseUrl).toString();

  return [
    "<!doctype html>",
    `<html lang="en">`,
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${title}</title>`,
    description,
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `    <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />`,
    "  </head>",
    `  <body data-theme="${escapeHtml(site.theme)}">`,
    '    <main class="l-page">',
    bodyHtml
      .split("\n")
      .map((line) => `      ${line}`)
      .join("\n"),
    "    </main>",
    "  </body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
};

