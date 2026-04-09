import { describe, expect, it } from "vitest";

import { LinkSchema, isValidHref } from "../src/schemas/shared.js";

const validHrefs = [
  "/",
  "/services?category=repair#top",
  "./contact",
  "../contact",
  "#contact",
  "?ref=summer",
  "https://example.com/path?x=1#y",
  "mailto:hello@example.com",
  "tel:+15555555555",
  "sms:+15555555555?body=Hello",
  "//cdn.example.com/library.js",
];

const invalidHrefs = [
  "",
  " ",
  "f",
  "services",
  "services/repair",
  "/start?x=<tag>",
  "https://example.com/path with space",
  "javascript:alert(1)",
  "data:text/html,hello",
  "http://",
  "mailto:",
  "tel:",
  "//",
  "not a url with spaces",
];

describe("LinkSchema", () => {
  it("accepts valid href variants", () => {
    for (const href of validHrefs) {
      expect(isValidHref(href), href).toBe(true);

      const result = LinkSchema.safeParse({
        label: "Example",
        href,
      });

      expect(result.success, href).toBe(true);
    }
  });

  it("rejects invalid href variants", () => {
    for (const href of invalidHrefs) {
      expect(isValidHref(href), href).toBe(false);

      const result = LinkSchema.safeParse({
        label: "Example",
        href,
      });

      expect(result.success, href).toBe(false);
    }
  });
});
