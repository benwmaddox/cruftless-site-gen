import { describe, expect, it } from "vitest";

import { renderGoogleMaps } from "./google-maps.render.js";
import { GoogleMapsSchema } from "./google-maps.schema.js";

describe("GoogleMapsSchema", () => {
  it("accepts valid map data and renders escaped iframe markup", () => {
    const parsed = GoogleMapsSchema.parse({
      type: "google-maps",
      embedUrl: "https://www.google.com/maps?q=78th+Street+Studios&output=embed&z=15",
      title: 'Visit <Map> "Preview"',
      caption: "Use the embedded map to plan your route.",
      size: "content",
    });

    const html = renderGoogleMaps(parsed);

    expect(html).toContain('<figure class="c-google-maps c-google-maps--size-content">');
    expect(html).toContain('<iframe class="c-google-maps__embed"');
    expect(html).toContain('title="Visit &lt;Map&gt; &quot;Preview&quot;"');
    expect(html).toContain("Use the embedded map to plan your route.");
    expect(html).not.toContain('title="Visit <Map> "Preview""');
  });

  it("rejects non-Google embed URLs and unknown fields", () => {
    const invalidUrl = GoogleMapsSchema.safeParse({
      type: "google-maps",
      embedUrl: "https://example.com/maps?q=78th+Street+Studios&output=embed",
      title: "Visit map",
    });

    expect(invalidUrl.success).toBe(false);
    if (invalidUrl.success) {
      return;
    }

    expect(invalidUrl.error.issues.some((issue) => issue.path.includes("embedUrl"))).toBe(true);

    const extraField = GoogleMapsSchema.safeParse({
      type: "google-maps",
      embedUrl: "https://www.google.com/maps?q=78th+Street+Studios&output=embed",
      title: "Visit map",
      zoom: 15,
    });

    expect(extraField.success).toBe(false);
    if (extraField.success) {
      return;
    }

    expect(extraField.error.issues.some((issue) => issue.code === "unrecognized_keys")).toBe(true);
  });
});
