import { escapeHtml } from "../../renderer/escape-html.js";
import type { HoursData } from "./hours.schema.js";

export const hoursClassNames = [
  "c-hours",
  "c-hours__inner",
  "c-hours__title",
  "c-hours__table",
  "c-hours__day",
  "c-hours__value",
  "c-hours__range",
  "c-hours__separator",
] as const;

const renderHoursEntry = (entry: HoursData["entries"][number]): string =>
  [
    "        <tr>",
    `          <th class="c-hours__day" scope="row">${escapeHtml(entry.day)}</th>`,
    '          <td class="c-hours__value">',
    '            <span class="c-hours__range">',
    `              <span>${escapeHtml(entry.open)}</span>`,
    '              <span class="c-hours__separator" aria-hidden="true">-</span>',
    `              <span>${escapeHtml(entry.close)}</span>`,
    "            </span>",
    "          </td>",
    "        </tr>",
  ].join("\n");

export const renderHours = (data: HoursData): string =>
  [
    '<section class="c-hours">',
    '  <div class="c-hours__inner">',
    data.title ? `    <h2 class="c-hours__title">${escapeHtml(data.title)}</h2>` : "",
    '    <table class="c-hours__table">',
    "      <tbody>",
    data.entries.map((entry) => renderHoursEntry(entry)).join("\n"),
    "      </tbody>",
    "    </table>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
