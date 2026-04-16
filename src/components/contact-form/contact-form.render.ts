import type { ContactFormData } from "./contact-form.schema.js";
import { escapeHtml } from "../../renderer/escape-html.js";

export const contactFormClassNames = [
  "c-contact-form",
  "c-contact-form__inner",
  "c-contact-form__title",
  "c-contact-form__intro",
  "c-contact-form__form",
  "c-contact-form__grid",
  "c-contact-form__field",
  "c-contact-form__field--full",
  "c-contact-form__label",
  "c-contact-form__input",
  "c-contact-form__textarea",
  "c-contact-form__actions",
  "c-contact-form__note",
  "c-contact-form__honeypot",
  "c-contact-form__submit",
  "c-contact-form__legend",
] as const;

const demoAlertMessage =
  "This is a demo contact form. No message was sent.";

export const renderContactForm = (data: ContactFormData): string => {
  const subjectHtml = data.subject
    ? `    <input type="hidden" name="subject" value="${escapeHtml(data.subject)}">`
    : "";
  const modeAttributes =
    data.mode === "demo"
      ? ` data-js="contact-form" data-contact-form-mode="demo" data-contact-form-demo-message="${escapeHtml(demoAlertMessage)}"`
      : ' data-js="contact-form" data-contact-form-mode="production"';

  return [
    '<section class="c-contact-form l-section">',
    '  <div class="c-contact-form__inner">',
    `    <h2 class="c-contact-form__title">${escapeHtml(data.title)}</h2>`,
    data.intro ? `    <p class="c-contact-form__intro">${escapeHtml(data.intro)}</p>` : "",
    `    <form class="c-contact-form__form l-item" action="${escapeHtml(data.action)}" method="post"${modeAttributes}>`,
    subjectHtml,
    '      <div class="c-contact-form__honeypot" aria-hidden="true">',
    '        <label class="c-contact-form__label" for="contact-website">Website</label>',
    '        <input class="c-contact-form__input" id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off">',
    "      </div>",
    '      <div class="c-contact-form__grid">',
    '        <div class="c-contact-form__field">',
    '          <label class="c-contact-form__label" for="contact-name">Name</label>',
    '          <input class="c-contact-form__input" id="contact-name" name="name" type="text" autocomplete="name" required>',
    "        </div>",
    '        <div class="c-contact-form__field">',
    '          <label class="c-contact-form__label" for="contact-email">Email</label>',
    '          <input class="c-contact-form__input" id="contact-email" name="email" type="email" autocomplete="email" required>',
    "        </div>",
    '        <div class="c-contact-form__field">',
    '          <label class="c-contact-form__label" for="contact-business">Business name</label>',
    '          <input class="c-contact-form__input" id="contact-business" name="businessName" type="text" autocomplete="organization">',
    "        </div>",
    '        <div class="c-contact-form__field">',
    '          <label class="c-contact-form__label" for="contact-phone">Phone</label>',
    '          <input class="c-contact-form__input" id="contact-phone" name="phone" type="tel" autocomplete="tel">',
    "        </div>",
    '        <div class="c-contact-form__field c-contact-form__field--full">',
    '          <label class="c-contact-form__label" for="contact-message">What do you need help with?</label>',
    '          <textarea class="c-contact-form__textarea" id="contact-message" name="message" rows="7" required></textarea>',
    "        </div>",
    "      </div>",
    '      <div class="c-contact-form__actions">',
    `        <button class="c-button c-button--primary c-contact-form__submit" type="submit">${escapeHtml(data.submitLabel)}</button>`,
    data.deliveryNote
      ? `        <p class="c-contact-form__note">${escapeHtml(data.deliveryNote)}</p>`
      : "",
    "      </div>",
    "    </form>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
