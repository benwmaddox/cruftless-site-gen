import { escapeHtml } from "../../renderer/escape-html.js";
import { normalizePhoneForTelHref } from "./contact.schema.js";
import type { ContactData } from "./contact.schema.js";

export const contactClassNames = [
  "c-contact",
  "c-contact__inner",
  "c-contact__title",
  "c-contact__list",
  "c-contact__item",
  "c-contact__label",
  "c-contact__value",
  "c-contact__address",
  "c-contact__link",
] as const;

const renderMultilineAddress = (address: string): string =>
  escapeHtml(address.trim()).replace(/\r?\n/g, "<br />");

const renderContactItem = (label: string, valueHtml: string): string =>
  [
    '      <div class="c-contact__item l-item">',
    `        <dt class="c-contact__label">${escapeHtml(label)}</dt>`,
    `        <dd class="c-contact__value">${valueHtml}</dd>`,
    "      </div>",
  ].join("\n");

export const renderContact = (data: ContactData): string => {
  const phoneHref = data.phone ? normalizePhoneForTelHref(data.phone) : undefined;
  const itemsHtml = [
    renderContactItem(
      "Address",
      `<address class="c-contact__address">${renderMultilineAddress(data.address)}</address>`,
    ),
    data.phone && phoneHref
      ? renderContactItem(
          "Phone",
          `<a class="c-contact__link" href="tel:${escapeHtml(phoneHref)}">${escapeHtml(data.phone)}</a>`,
        )
      : "",
    data.email
      ? renderContactItem(
          "Email",
          `<a class="c-contact__link" href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`,
        )
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    '<section class="c-contact l-section">',
    '  <div class="c-contact__inner">',
    data.title ? `    <h2 class="c-contact__title">${escapeHtml(data.title)}</h2>` : "",
    '    <dl class="c-contact__list">',
    itemsHtml,
    "    </dl>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
