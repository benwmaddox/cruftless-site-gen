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
      ],
    });

    const html = renderHours(parsed);

    expect(html).toContain('<section class="c-hours l-container l-section">');
    expect(html).toContain('<th class="c-hours__day" scope="row">Monday</th>');
    expect(html).toContain("8:00 AM");
    expect(html).toContain("Holiday");
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
});
