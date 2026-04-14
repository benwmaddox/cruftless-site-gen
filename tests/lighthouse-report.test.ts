import { describe, expect, it } from "vitest";

import {
  formatFailedCategoryDetails,
  shouldIgnoreCategoryFailure,
  type LighthouseReport,
} from "../src/build/lighthouse-report.js";

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

  it("tolerates browser console noise when it is one of two best-practices issues", () => {
    const report: LighthouseReport = {
      categories: {
        "best-practices": {
          auditRefs: [
            { id: "errors-in-console", weight: 1 },
            { id: "image-aspect-ratio", weight: 1 },
          ],
        },
      },
      audits: {
        "errors-in-console": {
          id: "errors-in-console",
          title: "Browser errors were logged to the console",
          score: 0,
        },
        "image-aspect-ratio": {
          id: "image-aspect-ratio",
          title: "Displays images with incorrect aspect ratio",
          score: 0,
        },
      },
    };

    expect(shouldIgnoreCategoryFailure(report, "best-practices")).toBe(true);
  });

  it("does not tolerate browser console noise when there are more than two issues", () => {
    const report: LighthouseReport = {
      categories: {
        "best-practices": {
          auditRefs: [
            { id: "errors-in-console", weight: 1 },
            { id: "image-aspect-ratio", weight: 1 },
            { id: "unused-css-rules", weight: 1 },
          ],
        },
      },
      audits: {
        "errors-in-console": {
          id: "errors-in-console",
          title: "Browser errors were logged to the console",
          score: 0,
        },
        "image-aspect-ratio": {
          id: "image-aspect-ratio",
          title: "Displays images with incorrect aspect ratio",
          score: 0,
        },
        "unused-css-rules": {
          id: "unused-css-rules",
          title: "Reduce unused CSS",
          score: 0,
        },
      },
    };

    expect(shouldIgnoreCategoryFailure(report, "best-practices")).toBe(false);
  });
});
