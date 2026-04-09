import {
  dedupeImageCandidates,
  extractLinkedCssImageCandidates,
  extractPageImageCandidates,
  extractStylesheetLinks,
  type ImageCandidate,
} from "./page-image-discovery.js";

export interface RemotePageImageDiscoveryResult {
  pageUrl: string;
  stylesheetUrls: string[];
  candidates: ImageCandidate[];
}

const defaultFetchHeaders = {
  "user-agent": "cruftless-site-gen image discovery",
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: defaultFetchHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

export const discoverRemotePageImages = async (
  pageUrlInput: string,
): Promise<RemotePageImageDiscoveryResult> => {
  const pageUrl = new URL(pageUrlInput).href;
  const html = await fetchText(pageUrl);
  const stylesheetUrls = extractStylesheetLinks(html, pageUrl);
  const linkedCssCandidates = (
    await Promise.all(
      stylesheetUrls.map(async (stylesheetUrl) => {
        try {
          const cssText = await fetchText(stylesheetUrl);
          return extractLinkedCssImageCandidates(stylesheetUrl, cssText, pageUrl);
        } catch (error) {
          if (error instanceof Error) {
            console.warn(`Skipping stylesheet ${stylesheetUrl}: ${error.message}`);
            return [];
          }

          throw error;
        }
      }),
    )
  ).flat();

  return {
    pageUrl,
    stylesheetUrls,
    candidates: dedupeImageCandidates([
      ...extractPageImageCandidates(html, pageUrl),
      ...linkedCssCandidates,
    ]),
  };
};
