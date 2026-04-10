import { escapeHtml } from "../../renderer/escape-html.js";
import { normalizePhoneForTelHref } from "../contact/contact.schema.js";
import type { StoreLocationHoursData } from "./store-location-hours.schema.js";

export const storeLocationHoursClassNames = [
  "c-store-location-hours",
  "c-store-location-hours__inner",
  "c-store-location-hours__title",
  "c-store-location-hours__grid",
  "c-store-location-hours__panel",
  "c-store-location-hours__panel-title",
  "c-store-location-hours__map-frame",
  "c-store-location-hours__map",
  "c-store-location-hours__contact-list",
  "c-store-location-hours__contact-row",
  "c-store-location-hours__contact-label",
  "c-store-location-hours__contact-value",
  "c-store-location-hours__address",
  "c-store-location-hours__link",
  "c-store-location-hours__hours-table",
  "c-store-location-hours__hours-day",
  "c-store-location-hours__hours-value",
  "c-store-location-hours__hours-range",
  "c-store-location-hours__hours-separator",
] as const;

const renderMultilineAddress = (address: string): string =>
  escapeHtml(address.trim()).replace(/\r?\n/g, "<br />");

const renderContactRow = (label: string, valueHtml: string): string =>
  [
    '          <div class="c-store-location-hours__contact-row">',
    `            <dt class="c-store-location-hours__contact-label">${escapeHtml(label)}</dt>`,
    `            <dd class="c-store-location-hours__contact-value">${valueHtml}</dd>`,
    "          </div>",
  ].join("\n");

const renderHoursEntry = (entry: StoreLocationHoursData["hours"][number]): string =>
  [
    "            <tr>",
    `              <th class="c-store-location-hours__hours-day" scope="row">${escapeHtml(entry.day)}</th>`,
    '              <td class="c-store-location-hours__hours-value">',
    '                <span class="c-store-location-hours__hours-range">',
    `                  <span>${escapeHtml(entry.open)}</span>`,
    '                  <span class="c-store-location-hours__hours-separator" aria-hidden="true">-</span>',
    `                  <span>${escapeHtml(entry.close)}</span>`,
    "                </span>",
    "              </td>",
    "            </tr>",
  ].join("\n");

export const renderStoreLocationHours = (data: StoreLocationHoursData): string => {
  const phoneHref = data.phone ? normalizePhoneForTelHref(data.phone) : undefined;
  const contactRows = [
    renderContactRow(
      "Address",
      `<address class="c-store-location-hours__address">${renderMultilineAddress(data.address)}</address>`,
    ),
    data.phone && phoneHref
      ? renderContactRow(
          "Phone",
          `<a class="c-store-location-hours__link" href="tel:${escapeHtml(phoneHref)}">${escapeHtml(data.phone)}</a>`,
        )
      : "",
    data.email
      ? renderContactRow(
          "Email",
          `<a class="c-store-location-hours__link" href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`,
        )
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    '<section class="c-store-location-hours">',
    '  <div class="c-store-location-hours__inner">',
    data.title ? `    <h2 class="c-store-location-hours__title">${escapeHtml(data.title)}</h2>` : "",
    '    <div class="c-store-location-hours__grid">',
    '      <div class="c-store-location-hours__panel">',
    '        <div class="c-store-location-hours__map-frame">',
    `          <iframe class="c-store-location-hours__map" src="${escapeHtml(data.embedUrl)}" title="${escapeHtml(data.mapTitle)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`,
    "        </div>",
    "      </div>",
    '      <section class="c-store-location-hours__panel">',
    '        <h3 class="c-store-location-hours__panel-title">Contact</h3>',
    '        <dl class="c-store-location-hours__contact-list">',
    contactRows,
    "        </dl>",
    "      </section>",
    '      <section class="c-store-location-hours__panel">',
    '        <h3 class="c-store-location-hours__panel-title">Hours</h3>',
    '        <table class="c-store-location-hours__hours-table">',
    "          <tbody>",
    data.hours.map((entry) => renderHoursEntry(entry)).join("\n"),
    "          </tbody>",
    "        </table>",
    "      </section>",
    "    </div>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
};
