import { describe, expect, it } from "vitest";

import { renderStoreLocationHours } from "./store-location-hours.render.js";
import { StoreLocationHoursSchema } from "./store-location-hours.schema.js";

describe("StoreLocationHoursSchema", () => {
  it("accepts valid content and renders the brochure location block", () => {
    const parsed = StoreLocationHoursSchema.parse({
      type: "store-location-hours",
      title: "Visit the showroom",
      embedUrl: "https://www.google.com/maps?q=New+York+NY&output=embed&z=13",
      mapTitle: "Showroom map",
      address: "123 Main Street\nCleveland, OH 44113",
      phone: "(555) 555-0100",
      email: "hello@example.com",
      hours: [
        {
          day: "Monday",
          open: "8:30 AM",
          close: "6:00 PM",
        },
        {
          day: "Holiday",
          open: "10:00 AM",
          close: "2:00 PM",
        },
      ],
    });

    const html = renderStoreLocationHours(parsed);

    expect(html).toContain('<section class="c-store-location-hours">');
    expect(html).toContain('class="c-store-location-hours__map"');
    expect(html).toContain('title="Showroom map"');
    expect(html).toContain('href="tel:5555550100"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain("Holiday");
    expect(html).toContain("8:30 AM");
  });

  it("rejects invalid phone numbers", () => {
    const result = StoreLocationHoursSchema.safeParse({
      type: "store-location-hours",
      embedUrl: "https://www.google.com/maps?q=New+York+NY&output=embed&z=13",
      mapTitle: "Showroom map",
      address: "123 Main Street",
      phone: "call us maybe",
      hours: [
        {
          day: "Monday",
          open: "8:30 AM",
          close: "6:00 PM",
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
