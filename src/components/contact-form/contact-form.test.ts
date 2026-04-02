import { describe, expect, it } from "vitest";

import { renderContactForm } from "./contact-form.render.js";
import { ContactFormSchema } from "./contact-form.schema.js";

describe("ContactFormSchema", () => {
  it("accepts valid content and renders a working form shell", () => {
    const parsed = ContactFormSchema.parse({
      type: "contact-form",
      title: "Tell me about your business",
      intro: "Share a few details and I will reply by email.",
      action: "/api/contact",
      submitLabel: "Send inquiry",
      subject: "New brochure site inquiry",
      deliveryNote: "Messages are routed through Cloudflare and answered by email.",
    });

    const html = renderContactForm(parsed);

    expect(html).toContain('<section class="c-contact-form">');
    expect(html).toContain('action="/api/contact"');
    expect(html).toContain('name="message"');
    expect(html).toContain("Send inquiry");
    expect(html).toContain('type="hidden" name="subject" value="New brochure site inquiry"');
  });

  it("rejects unknown fields and missing action", () => {
    const extraField = ContactFormSchema.safeParse({
      type: "contact-form",
      title: "Tell me about your business",
      action: "/api/contact",
      submitLabel: "Send inquiry",
      theme: "loud",
    });

    expect(extraField.success).toBe(false);
    if (extraField.success) {
      return;
    }

    expect(extraField.error.issues[0]?.code).toBe("unrecognized_keys");

    const missingAction = ContactFormSchema.safeParse({
      type: "contact-form",
      title: "Tell me about your business",
      submitLabel: "Send inquiry",
    });

    expect(missingAction.success).toBe(false);
    if (missingAction.success) {
      return;
    }

    expect(
      missingAction.error.issues.some(
        (issue) => String(issue.path.join(".")) === "action",
      ),
    ).toBe(true);
  });
});
