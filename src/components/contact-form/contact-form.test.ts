import { describe, expect, it } from "vitest";

import { renderContactForm } from "./contact-form.render.js";
import { ContactFormSchema } from "./contact-form.schema.js";

describe("ContactFormSchema", () => {
  it("accepts valid content and renders a working form shell", () => {
    const parsed = ContactFormSchema.parse({
      type: "contact-form",
      mode: "production",
      title: "Tell me about your business",
      intro: "Share a few details and I will reply by email.",
      action: "/api/contact",
      submitLabel: "Send inquiry",
      subject: "New brochure site inquiry",
      deliveryNote: "Messages are routed through Cloudflare and answered by email.",
    });

    const html = renderContactForm(parsed);

    expect(html).toContain('<section class="c-contact-form l-section">');
    expect(html).toContain('action="/api/contact"');
    expect(html).toContain('data-contact-form-mode="production"');
    expect(html).toContain('name="message"');
    expect(html).toContain("Send inquiry");
    expect(html).toContain('type="hidden" name="subject" value="New brochure site inquiry"');
  });

  it("renders demo mode as a non-sending form", () => {
    const parsed = ContactFormSchema.parse({
      type: "contact-form",
      mode: "demo",
      title: "Tell me about your business",
      action: "/api/contact",
      submitLabel: "Send inquiry",
    });

    const html = renderContactForm(parsed);

    expect(html).toContain('data-contact-form-mode="demo"');
    expect(html).toContain("This is a demo contact form. No message was sent.");
  });

  it("rejects unknown fields and missing action or mode", () => {
    const extraField = ContactFormSchema.safeParse({
      type: "contact-form",
      mode: "production",
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
      mode: "production",
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

    const missingMode = ContactFormSchema.safeParse({
      type: "contact-form",
      title: "Tell me about your business",
      action: "/api/contact",
      submitLabel: "Send inquiry",
    });

    expect(missingMode.success).toBe(false);
    if (missingMode.success) {
      return;
    }

    expect(
      missingMode.error.issues.some((issue) => String(issue.path.join(".")) === "mode"),
    ).toBe(true);
  });
});
