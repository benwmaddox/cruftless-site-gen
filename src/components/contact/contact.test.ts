import { describe, expect, it } from "vitest";

import { renderContact } from "./contact.render.js";
import { ContactSchema, normalizePhoneForTelHref } from "./contact.schema.js";

describe("ContactSchema", () => {
  it("renders a required address and optional clickable phone and email fields", () => {
    const parsed = ContactSchema.parse({
      type: "contact",
      title: "Contact Us",
      address: "123 Main St\nSpringfield, IL 62701",
      phone: "(555) 123-4567 ext 89",
      email: "hello@example.com",
    });

    const html = renderContact(parsed);

    expect(normalizePhoneForTelHref(parsed.phone ?? "")).toBe("5551234567;ext=89");
    expect(html).toContain('<section class="c-contact l-section">');
    expect(html).toContain('href="tel:5551234567;ext=89"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain("123 Main St<br />Springfield, IL 62701");
  });

  it("rejects invalid phone and email values", () => {
    const result = ContactSchema.safeParse({
      type: "contact",
      address: "123 Main St",
      phone: "call me maybe",
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "phone")).toBe(true);
    expect(result.error.issues.some((issue) => String(issue.path.join(".")) === "email")).toBe(true);
  });
});
