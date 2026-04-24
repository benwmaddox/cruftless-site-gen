import { describe, expect, it } from "vitest";

import { renderHours } from "./hours.render.js";
import { HoursSchema } from "./hours.schema.js";

describe("HoursSchema", () => {
  it("renders aligned day and hour rows with supported override labels", () => {
    const parsed = HoursSchema.parse({
      type: "hours",
      title: "Shop Hours",
      entries: [
        {
          day: "Monday",
          open: "8:00 AM",
          close: "5:00 PM",
        },
        {
          day: "Holiday",
          open: "9:00 AM",
          close: "1:00 PM",
        },
        {
          day: "Sunday",
          open: "Closed",
          close: "Closed",
        },
      ],
    });

    const html = renderHours(parsed);

    expect(html).toContain('<section class="c-hours l-container l-section">');
    expect(html).toContain('<th class="c-hours__day" scope="row">Monday</th>');
    expect(html).toContain("8:00 AM");
    expect(html).toContain("Holiday");
    expect(html).toContain("Closed");
    expect(html).not.toContain('<span class="c-hours__separator" aria-hidden="true">-</span>\n              <span>Closed</span>');
  });

  it("rejects invalid day labels and malformed time strings", () => {
    const result = HoursSchema.safeParse({
      type: "hours",
      entries: [
        {
          day: "Mon",
          open: "8",
          close: "17:00",
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "entries.0.day")).toBe(
      true,
    );
    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "entries.0.open")).toBe(
      true,
    );
    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "entries.0.close")).toBe(
      true,
    );
  });

  it("accepts a closed day using Closed for both bounds", () => {
    const result = HoursSchema.safeParse({
      type: "hours",
      entries: [
        {
          day: "Sunday",
          open: "Closed",
          close: "Closed",
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const html = renderHours(result.data);
    expect(html).toContain("<span>Closed</span>");
  });
});
