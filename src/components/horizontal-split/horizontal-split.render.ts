import { escapeHtml } from "../../renderer/escape-html.js";
import type { HorizontalSplitData } from "./horizontal-split.schema.js";

export const horizontalSplitClassNames = [
  "c-horizontal-split",
  "c-horizontal-split__inner",
  "c-horizontal-split__title",
  "c-horizontal-split__grid",
  "c-horizontal-split__panel",
] as const;

export const renderHorizontalSplit = <Component>(
  data: HorizontalSplitData<Component>,
  renderChild: (component: Component) => string,
): string =>
  [
    '<section class="c-horizontal-split">',
    '  <div class="c-horizontal-split__inner">',
    data.title ? `    <h2 class="c-horizontal-split__title">${escapeHtml(data.title)}</h2>` : "",
    '    <div class="c-horizontal-split__grid">',
    '      <div class="c-horizontal-split__panel">',
    renderChild(data.first)
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n"),
    "      </div>",
    '      <div class="c-horizontal-split__panel">',
    renderChild(data.second)
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n"),
    "      </div>",
    "    </div>",
    "  </div>",
    "</section>",
  ]
    .filter(Boolean)
    .join("\n");
