import type { PageData, SiteData } from "../schemas/site.schema.js";
import { escapeHtml } from "./escape-html.js";

const shouldIncludeGoogleAnalytics = (): boolean => process.env.LIGHTHOUSE_CI !== "1";

const renderGoogleAnalyticsTags = (site: SiteData): string => {
  const measurementId = site.googleAnalyticsMeasurementId;

  if (!measurementId || !shouldIncludeGoogleAnalytics()) {
    return "";
  }

  const loaderUrl = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;

  return [
    `    <script async src="${escapeHtml(loaderUrl)}"></script>`,
    "    <script>",
    "      window.dataLayer = window.dataLayer || [];",
    "      function gtag(){dataLayer.push(arguments);}",
    "      gtag('js', new Date());",
    `      gtag('config', ${JSON.stringify(measurementId)});`,
    "    </script>",
  ].join("\n");
};

export const renderPageDocument = ({
  site,
  page,
  bodyHtml,
  stylesheetHref,
  scriptHref,
}: {
  site: SiteData;
  page: PageData;
  bodyHtml: string;
  stylesheetHref: string;
  scriptHref?: string;
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
    renderGoogleAnalyticsTags(site),
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `    <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />`,
    scriptHref ? `    <script src="${escapeHtml(scriptHref)}" defer></script>` : "",
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
