import { describe, expect, it } from "vitest";

import {
  buildBackupObjectKey,
  buildLiveObjectKey,
  detectCacheControl,
  isDnsSafeSlug,
  normalizeDeployConfig,
  shouldExcludeFromBackup,
  toSafeTimestamp,
} from "../scripts/deploy-lib.mjs";

describe("deploy lib", () => {
  it("normalizes deploy config and resolves defaults", () => {
    const config = normalizeDeployConfig(
      {
        sites: [
          {
            slug: "smartwayappliancerepair",
            sitePath: "F:/Refreshes/smartwayappliancerepair-com",
          },
        ],
      },
      "F:/cruftless-site-gen/deploy/sites.json",
    );

    expect(config.cloudflare.domainSuffix).toBe("sitebyemail.com");
    expect(config.sites[0].publishDir).toBe("dist");
    expect(config.sites[0].sitePath).toContain("F:\\Refreshes\\smartwayappliancerepair-com");
  });

  it("rejects duplicate or invalid slugs", () => {
    expect(() =>
      normalizeDeployConfig(
        {
          sites: [{ slug: "bad slug", sitePath: "F:/Refreshes/one" }],
        },
        "F:/cruftless-site-gen/deploy/sites.json",
      ),
    ).toThrow(/DNS-safe/);

    expect(() =>
      normalizeDeployConfig(
        {
          sites: [
            { slug: "alpha-site", sitePath: "F:/Refreshes/one" },
            { slug: "alpha-site", sitePath: "F:/Refreshes/two" },
          ],
        },
        "F:/cruftless-site-gen/deploy/sites.json",
      ),
    ).toThrow(/Duplicate/);
  });

  it("builds live and backup object keys", () => {
    expect(
      buildLiveObjectKey({
        livePrefix: "live",
        slug: "alpha-site",
        relativePath: "assets/main.css",
      }),
    ).toBe("live/alpha-site/assets/main.css");

    expect(
      buildBackupObjectKey({
        backupPrefix: "backups",
        slug: "alpha-site",
        timestamp: "2026-04-10T16-20-00Z",
      }),
    ).toBe("backups/alpha-site/2026-04-10T16-20-00Z.zip");
  });

  it("detects cache control policy and backup exclusions", () => {
    expect(detectCacheControl("index.html")).toBe("no-cache");
    expect(detectCacheControl("assets/main.abcdef123456.css")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(shouldExcludeFromBackup("node_modules/chokidar/index.js")).toBe(true);
    expect(shouldExcludeFromBackup("content/site.json")).toBe(false);
  });

  it("validates dns-safe slugs and timestamps", () => {
    expect(isDnsSafeSlug("alpha-site")).toBe(true);
    expect(isDnsSafeSlug("AlphaSite")).toBe(false);
    expect(toSafeTimestamp("2026-04-10T16:20:30.000Z")).toBe("2026-04-10T16-20-30Z");
  });
});
