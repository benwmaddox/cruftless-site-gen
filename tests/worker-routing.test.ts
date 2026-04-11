import { describe, expect, it } from "vitest";

import worker from "../deploy/worker/src/index.mjs";
import { buildCandidateKeys, getSlugFromHostname } from "../deploy/worker/src/routing.mjs";

const createObject = (body: string, contentType = "text/html; charset=utf-8") => ({
  body,
  httpEtag: '"etag"',
  writeHttpMetadata(headers: Headers) {
    headers.set("content-type", contentType);
  },
});

describe("worker routing", () => {
  it("derives a slug from the hostname and builds path candidates", () => {
    expect(getSlugFromHostname("alpha-site.sitebyemail.com", "sitebyemail.com")).toBe(
      "alpha-site",
    );
    expect(getSlugFromHostname("alpha.site.other.com", "sitebyemail.com")).toBeNull();
    expect(
      buildCandidateKeys({
        livePrefix: "live",
        slug: "alpha-site",
        pathname: "/about",
      }),
    ).toEqual([
      "live/alpha-site/about",
      "live/alpha-site/about/index.html",
      "live/alpha-site/about.html",
    ]);
  });

  it("serves the first matching object and falls back to site 404", async () => {
    const objects = new Map([
      ["live/alpha-site/about.html", createObject("<h1>About</h1>")],
      ["live/alpha-site/404.html", createObject("<h1>Not found</h1>")],
    ]);

    const env = {
      DOMAIN_SUFFIX: "sitebyemail.com",
      LIVE_PREFIX: "live",
      LIVE_BUCKET: {
        get(key: string) {
          return Promise.resolve(objects.get(key) ?? null);
        },
      },
    };

    const aboutResponse = await worker.fetch(
      new Request("https://alpha-site.sitebyemail.com/about"),
      env,
    );
    expect(aboutResponse.status).toBe(200);
    expect(await aboutResponse.text()).toContain("About");

    const missingResponse = await worker.fetch(
      new Request("https://alpha-site.sitebyemail.com/missing"),
      env,
    );
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.text()).toContain("Not found");
  });
});
