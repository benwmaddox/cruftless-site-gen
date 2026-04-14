import { describe, expect, it } from "vitest";

import { formatFailedCategoryDetails, type LighthouseReport } from "../src/build/lighthouse-report.js";

describe("Lighthouse report summaries", () => {
  it("lists the most impactful failing audits first", () => {
    const report: LighthouseReport = {
      categories: {
        performance: {
          auditRefs: [
            { id: "unused-javascript", weight: 3 },
            { id: "render-blocking-resources", weight: 2 },
            { id: "uses-long-cache-ttl", weight: 1 },
          ],
        },
      },
      audits: {
        "unused-javascript": {
          title: "Reduce unused JavaScript",
          score: 0,
          details: {
            type: "opportunity",
            overallSavingsBytes: 512000,
          },
        },
        "render-blocking-resources": {
          title: "Eliminate render-blocking resources",
          score: 0.5,
          details: {
            type: "opportunity",
            overallSavingsMs: 240,
          },
        },
        "uses-long-cache-ttl": {
          title: "Serve static assets with an efficient cache policy",
          score: 1,
          details: {
            type: "opportunity",
            overallSavingsBytes: 1000,
          },
        },
      },
    };

    const details = formatFailedCategoryDetails(report, "performance");

    expect(details).toEqual([
      "  Top related audits:",
      "    - Reduce unused JavaScript (0): estimated savings 500 KiB",
      "    - Eliminate render-blocking resources (50): estimated savings 240ms",
    ]);
  });

  it("returns no detail block when the category has no failing audits", () => {
    const report: LighthouseReport = {
      categories: {
        accessibility: {
          auditRefs: [{ id: "color-contrast", weight: 1 }],
        },
      },
      audits: {
        "color-contrast": {
          title: "Contrast",
          score: 1,
        },
      },
    };

    expect(formatFailedCategoryDetails(report, "accessibility")).toEqual([]);
  });
});
