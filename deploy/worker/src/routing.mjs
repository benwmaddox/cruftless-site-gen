const DNS_SAFE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const normalizeDomainSuffix = (domainSuffix) =>
  domainSuffix.toLowerCase().replace(/^\*\./u, "").replace(/\.+$/u, "");

const stripPort = (hostname) => hostname.toLowerCase().replace(/:\d+$/u, "");

export const getSlugFromHostname = (hostname, domainSuffix) => {
  const normalizedHost = stripPort(hostname);
  const normalizedSuffix = normalizeDomainSuffix(domainSuffix);

  if (!normalizedHost.endsWith(`.${normalizedSuffix}`)) {
    return null;
  }

  const subdomain = normalizedHost.slice(0, normalizedHost.length - normalizedSuffix.length - 1);

  if (!subdomain || subdomain.includes(".")) {
    return null;
  }

  return DNS_SAFE_SLUG_PATTERN.test(subdomain) ? subdomain : null;
};

const trimSlashes = (value) => value.replace(/^\/+/u, "").replace(/\/+$/u, "");

const withPrefix = (livePrefix, slug, suffix) => {
  const parts = [trimSlashes(livePrefix), slug, trimSlashes(suffix)].filter(Boolean);
  return parts.join("/");
};

export const buildCandidateKeys = ({ livePrefix = "live", slug, pathname }) => {
  const cleanedPath = trimSlashes(pathname);

  if (!cleanedPath) {
    return [withPrefix(livePrefix, slug, "index.html")];
  }

  if (pathname.endsWith("/")) {
    return [
      withPrefix(livePrefix, slug, `${cleanedPath}/index.html`),
      withPrefix(livePrefix, slug, `${cleanedPath}.html`),
    ];
  }

  if (/\.[A-Za-z0-9]+$/u.test(cleanedPath)) {
    return [withPrefix(livePrefix, slug, cleanedPath)];
  }

  return [
    withPrefix(livePrefix, slug, cleanedPath),
    withPrefix(livePrefix, slug, `${cleanedPath}/index.html`),
    withPrefix(livePrefix, slug, `${cleanedPath}.html`),
  ];
};

export const buildNotFoundKey = ({ livePrefix = "live", slug }) =>
  withPrefix(livePrefix, slug, "404.html");
