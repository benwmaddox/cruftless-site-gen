import { buildCandidateKeys, buildNotFoundKey, getSlugFromHostname } from "./routing.mjs";

const toResponse = (object, requestMethod, status = 200) => {
  const headers = new Headers();

  if (typeof object.writeHttpMetadata === "function") {
    object.writeHttpMetadata(headers);
  } else if (object.httpMetadata?.contentType) {
    headers.set("content-type", object.httpMetadata.contentType);
  }

  if (object.httpEtag) {
    headers.set("etag", object.httpEtag);
  }

  return new Response(requestMethod === "HEAD" ? null : object.body, {
    status,
    headers,
  });
};

const notFoundResponse = () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const domainSuffix = env.DOMAIN_SUFFIX ?? "sitebyemail.com";
    const livePrefix = env.LIVE_PREFIX ?? "live";
    const slug = getSlugFromHostname(url.hostname, domainSuffix);

    if (!slug) {
      return notFoundResponse();
    }

    for (const key of buildCandidateKeys({
      livePrefix,
      slug,
      pathname: url.pathname,
    })) {
      const object = await env.LIVE_BUCKET.get(key);

      if (object) {
        return toResponse(object, request.method);
      }
    }

    const siteNotFound = await env.LIVE_BUCKET.get(buildNotFoundKey({ livePrefix, slug }));

    if (siteNotFound) {
      return toResponse(siteNotFound, request.method, 404);
    }

    return notFoundResponse();
  },
};
