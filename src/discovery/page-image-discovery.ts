export interface ImageCandidate {
  url: string;
  source: string;
  score: number;
  sameOrigin: boolean;
}

const urlLikePattern = /url\(([^)]+)\)/gi;
const srcsetEntryDelimiter = /\s*,\s*/;
const invalidUrlPattern = /^(?:data:|javascript:|about:|#)/i;
const nonImageAssetPattern = /\.(?:css|js|woff2?|ttf|otf|eot)(?:[?#].*)?$/i;
const lowSignalImagePattern =
  /(?:^|[-_/])(logo|icon|badge|seal|partner|cert(?:ification)?|award|rating|star)(?:[-_/]|$)/i;
const highSignalImagePattern =
  /(?:^|[-_/])(hero|banner|background|bg|landing|service|truck|team|about|home)(?:[-_/]|$)/i;
const transformedVariantSuffixPattern = /_[0-9a-f]{6,}(?=\.[^.]+$)/i;

const decodeHtmlEntity = (value: string): string =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const normalizeAttributeValue = (value: string): string => decodeHtmlEntity(value.trim());

const normalizeRawUrl = (rawValue: string): string =>
  normalizeAttributeValue(rawValue).replace(/^['"]|['"]$/g, "").trim();

const tryResolveUrl = (rawValue: string, baseUrl: string): string | null => {
  const normalizedValue = normalizeRawUrl(rawValue);

  if (!normalizedValue || invalidUrlPattern.test(normalizedValue)) {
    return null;
  }

  try {
    const resolvedUrl = new URL(normalizedValue, baseUrl);
    if (!/^https?:$/i.test(resolvedUrl.protocol)) {
      return null;
    }

    return resolvedUrl.href;
  } catch {
    return null;
  }
};

const parseAttributes = (tagMarkup: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  const attributePattern =
    /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let skippedTagName = false;

  for (const match of tagMarkup.matchAll(attributePattern)) {
    const [, rawName, doubleQuotedValue, singleQuotedValue, bareValue] = match;
    if (!rawName) {
      continue;
    }

    const name = rawName.toLowerCase();
    if (!skippedTagName) {
      skippedTagName = true;
      continue;
    }

    const value = doubleQuotedValue ?? singleQuotedValue ?? bareValue ?? "";
    attributes[name] = normalizeAttributeValue(value);
  }

  return attributes;
};

const extractCssUrls = (cssText: string): string[] => {
  const matches = new Set<string>();
  const backgroundRulePattern =
    /background(?:-image)?\s*:[^;{}]*url\(([^)]+)\)[^;{}]*(?:;|$)/gi;

  for (const match of cssText.matchAll(backgroundRulePattern)) {
    const rawMatch = match[0];
    if (!rawMatch) {
      continue;
    }

    for (const urlMatch of rawMatch.matchAll(urlLikePattern)) {
      const rawUrl = urlMatch[1];
      if (rawUrl) {
        matches.add(rawUrl);
      }
    }
  }

  return [...matches];
};

const scoreImageUrl = (candidateUrl: string, baseScore: number): number => {
  const pathname = new URL(candidateUrl).pathname;
  let score = baseScore;

  if (lowSignalImagePattern.test(pathname)) {
    score -= 20;
  }

  if (highSignalImagePattern.test(pathname)) {
    score += 8;
  }

  if (pathname.endsWith(".svg")) {
    score -= 10;
  }

  return score;
};

const buildCandidate = (
  candidateUrl: string,
  pageUrl: string,
  source: string,
  baseScore: number,
): ImageCandidate => ({
  url: candidateUrl,
  source,
  score: scoreImageUrl(candidateUrl, baseScore),
  sameOrigin: new URL(candidateUrl).origin === new URL(pageUrl).origin,
});

const canonicalizeCandidateUrl = (candidateUrl: string): string => {
  const parsedUrl = new URL(candidateUrl);
  parsedUrl.hash = "";
  parsedUrl.search = "";
  parsedUrl.pathname = parsedUrl.pathname.replace(transformedVariantSuffixPattern, "");
  return parsedUrl.href;
};

const extractMetaImageCandidates = (html: string, pageUrl: string): ImageCandidate[] => {
  const candidates: ImageCandidate[] = [];

  for (const metaTag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tagMarkup = metaTag[0];
    if (!tagMarkup) {
      continue;
    }

    const attributes = parseAttributes(tagMarkup);
    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();
    const content = attributes.content;

    if (!content) {
      continue;
    }

    let source: string | null = null;
    let score = 0;

    if (key === "og:image" || key === "og:image:secure_url") {
      source = `meta:${key}`;
      score = 100;
    } else if (key === "twitter:image" || key === "twitter:image:src") {
      source = `meta:${key}`;
      score = 95;
    }

    if (!source) {
      continue;
    }

    const resolvedUrl = tryResolveUrl(content, pageUrl);
    if (!resolvedUrl) {
      continue;
    }

    candidates.push(buildCandidate(resolvedUrl, pageUrl, source, score));
  }

  return candidates;
};

const extractInlineStyleCandidates = (html: string, pageUrl: string): ImageCandidate[] => {
  const candidates: ImageCandidate[] = [];

  for (const tagMatch of html.matchAll(/<[^>]+\sstyle=(?:"[^"]*"|'[^']*')[^>]*>/gi)) {
    const tagMarkup = tagMatch[0];
    if (!tagMarkup) {
      continue;
    }

    const attributes = parseAttributes(tagMarkup);
    const styleValue = attributes.style;

    if (!styleValue) {
      continue;
    }

    for (const rawUrl of extractCssUrls(styleValue)) {
      const resolvedUrl = tryResolveUrl(rawUrl, pageUrl);
      if (!resolvedUrl) {
        continue;
      }

      candidates.push(buildCandidate(resolvedUrl, pageUrl, "inline-style", 90));
    }
  }

  return candidates;
};

const extractStyleTagCandidates = (html: string, pageUrl: string): ImageCandidate[] => {
  const candidates: ImageCandidate[] = [];

  for (const styleMatch of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const styleContent = styleMatch[1];
    if (!styleContent) {
      continue;
    }

    for (const rawUrl of extractCssUrls(styleContent)) {
      const resolvedUrl = tryResolveUrl(rawUrl, pageUrl);
      if (!resolvedUrl) {
        continue;
      }

      candidates.push(buildCandidate(resolvedUrl, pageUrl, "style-tag", 85));
    }
  }

  return candidates;
};

const extractImageTagCandidates = (html: string, pageUrl: string): ImageCandidate[] => {
  const candidates: ImageCandidate[] = [];

  for (const imgTag of html.matchAll(/<img\b[^>]*>/gi)) {
    const tagMarkup = imgTag[0];
    if (!tagMarkup) {
      continue;
    }

    const attributes = parseAttributes(tagMarkup);
    const src = attributes.src;
    const srcset = attributes.srcset;

    if (src) {
      const resolvedUrl = tryResolveUrl(src, pageUrl);
      if (resolvedUrl) {
        candidates.push(buildCandidate(resolvedUrl, pageUrl, "img:src", 70));
      }
    }

    if (!srcset) {
      continue;
    }

    for (const srcsetEntry of srcset.split(srcsetEntryDelimiter)) {
      const [rawCandidateUrl] = srcsetEntry.trim().split(/\s+/, 1);
      if (!rawCandidateUrl) {
        continue;
      }

      const resolvedUrl = tryResolveUrl(rawCandidateUrl, pageUrl);
      if (!resolvedUrl) {
        continue;
      }

      candidates.push(buildCandidate(resolvedUrl, pageUrl, "img:srcset", 72));
    }
  }

  return candidates;
};

export const extractStylesheetLinks = (html: string, pageUrl: string): string[] => {
  const stylesheetUrls = new Set<string>();

  for (const linkTag of html.matchAll(/<link\b[^>]*>/gi)) {
    const tagMarkup = linkTag[0];
    if (!tagMarkup) {
      continue;
    }

    const attributes = parseAttributes(tagMarkup);
    const rel = (attributes.rel ?? "").toLowerCase();
    const href = attributes.href;

    if (!href || !rel.split(/\s+/).includes("stylesheet")) {
      continue;
    }

    const resolvedUrl = tryResolveUrl(href, pageUrl);
    if (resolvedUrl) {
      stylesheetUrls.add(resolvedUrl);
    }
  }

  return [...stylesheetUrls];
};

export const extractLinkedCssImageCandidates = (
  stylesheetUrl: string,
  cssText: string,
  pageUrl: string,
): ImageCandidate[] =>
  extractCssUrls(cssText)
    .map((rawUrl) => {
      const resolvedUrl = tryResolveUrl(rawUrl, stylesheetUrl);
      if (!resolvedUrl) {
        return null;
      }

      return buildCandidate(resolvedUrl, pageUrl, `linked-css:${stylesheetUrl}`, 88);
    })
    .filter((candidate): candidate is ImageCandidate => candidate !== null);

export const dedupeImageCandidates = (
  candidates: readonly ImageCandidate[],
): ImageCandidate[] => {
  const candidateByUrl = new Map<string, ImageCandidate>();

  for (const candidate of candidates) {
    if (nonImageAssetPattern.test(candidate.url)) {
      continue;
    }

    const candidateKey = canonicalizeCandidateUrl(candidate.url);
    const existingCandidate = candidateByUrl.get(candidateKey);
    if (!existingCandidate || candidate.score > existingCandidate.score) {
      candidateByUrl.set(candidateKey, candidate);
    }
  }

  return [...candidateByUrl.values()].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.url.localeCompare(right.url);
  });
};

export const extractPageImageCandidates = (
  html: string,
  pageUrl: string,
): ImageCandidate[] =>
  dedupeImageCandidates([
    ...extractMetaImageCandidates(html, pageUrl),
    ...extractInlineStyleCandidates(html, pageUrl),
    ...extractStyleTagCandidates(html, pageUrl),
    ...extractImageTagCandidates(html, pageUrl),
  ]);
