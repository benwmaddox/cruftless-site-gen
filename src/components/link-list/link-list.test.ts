import { describe, expect, it } from "vitest";

import { renderLinkList } from "./link-list.render.js";
import { LinkListSchema } from "./link-list.schema.js";

describe("LinkListSchema", () => {
  it("accepts valid content and renders current and linked options", () => {
    const parsed = LinkListSchema.parse({
      type: "link-list",
      title: "View this example in another style",
      lead: "Each option opens a prebuilt sibling page.",
      links: [
        {
          label: "Corporate",
          href: "/examples/automotive/corporate/",
          current: true,
        },
        {
          label: "Brutalism",
          href: "/examples/automotive/brutalism/",
        },
      ],
    });

    const html = renderLinkList(parsed);

    expect(html).toContain('<section class="c-link-list">');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/examples/automotive/brutalism/"');
    expect(html).toContain("prebuilt sibling page");
  });

  it("rejects unknown fields inside a link item", () => {
    const result = LinkListSchema.safeParse({
      type: "link-list",
      title: "View this example in another style",
      links: [
        {
          label: "Corporate",
          href: "/examples/automotive/corporate/",
          active: true,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "links.0",
      ),
    ).toBe(true);
  });
});
