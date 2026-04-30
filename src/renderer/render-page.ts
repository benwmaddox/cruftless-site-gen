import type { PageData, SiteData } from "../schemas/site.schema.js";
import { escapeHtml } from "./escape-html.js";

const shouldIncludeGoogleAnalytics = (): boolean =>
  process.env.LIGHTHOUSE_CI !== "1" && process.env.CRUFTLESS_DISABLE_ANALYTICS !== "1";

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
  socialImageUrl: resolvedSocialImageUrl,
}: {
  site: SiteData;
  page: PageData;
  bodyHtml: string;
  stylesheetHref: string;
  scriptHref?: string;
  socialImageUrl?: string;
}): string => {
  const title =
    page.slug === "/" ? escapeHtml(site.name) : `${escapeHtml(page.title)} | ${escapeHtml(site.name)}`;
  const description = page.metadata?.description
    ? `<meta name="description" content="${escapeHtml(page.metadata.description)}" />`
    : "";
  const canonicalUrl = page.metadata?.canonicalUrl ?? new URL(page.slug, site.baseUrl).toString();
  const configuredSocialImageUrl = resolvedSocialImageUrl ?? page.metadata?.socialImageUrl;
  const socialImageUrl = configuredSocialImageUrl
    ? new URL(configuredSocialImageUrl, site.baseUrl).toString()
    : undefined;
  const socialMetadata = socialImageUrl
    ? [
        `    <meta property="og:title" content="${title}" />`,
        page.metadata?.description
          ? `    <meta property="og:description" content="${escapeHtml(page.metadata.description)}" />`
          : "",
        '    <meta property="og:type" content="website" />',
        `    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
        `    <meta property="og:image" content="${escapeHtml(socialImageUrl)}" />`,
        '    <meta name="twitter:card" content="summary_large_image" />',
        `    <meta name="twitter:title" content="${title}" />`,
        page.metadata?.description
          ? `    <meta name="twitter:description" content="${escapeHtml(page.metadata.description)}" />`
          : "",
        `    <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const indent = (html: string, spaces: number = 4): string =>
    html
      .split("\n")
      .map((line) => line ? `${" ".repeat(spaces)}${line}` : "")
      .join("\n");

  return [
    "<!doctype html>",
    `<html lang="en">`,
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `    <title>${title}</title>`,
    description,
    socialMetadata,
    renderGoogleAnalyticsTags(site),
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `    <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />`,
    scriptHref ? `    <script src="${escapeHtml(scriptHref)}" defer></script>` : "",
    "  </head>",
    `  <body data-theme="${escapeHtml(site.theme)}">`,
    '    <a class="skip-link" href="#main-content">Skip to content</a>',
    indent(bodyHtml),
    "  </body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
};
