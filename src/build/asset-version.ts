import { createHash } from "node:crypto";

export const createContentVersion = (contents: string | Uint8Array): string =>
  createHash("sha1").update(contents).digest("hex").slice(0, 12);

export const appendVersionQuery = (
  href: string,
  version: string | undefined,
): string => {
  if (!version) {
    return href;
  }

  const hashIndex = href.indexOf("#");
  const hrefWithoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hashSuffix = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const queryDelimiter = hrefWithoutHash.includes("?") ? "&" : "?";

  return `${hrefWithoutHash}${queryDelimiter}v=${encodeURIComponent(version)}${hashSuffix}`;
};
