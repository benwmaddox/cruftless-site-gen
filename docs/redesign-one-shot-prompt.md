# One-shot site redesign prompt

Use this prompt when you want an LLM to inspect an existing public website and rebuild it as a redesigned site using this repo's JSON-driven site generator.

Replace the bracketed placeholders before use.

```text
You are migrating an existing public website into the Cruftless Site Gen format used in this repo.

Goal:
- Inspect the source site at [SOURCE_SITE_URL].
- Rebuild it as a cleaner, better designed site using the existing site generator approach in this repo.
- Preserve all reasonable source copy, all meaningful public pages, all important images, and all important site details unless there is a clearly documented reason not to.
- Do not claim the result is ready for customer review until you complete the full steelman check below and pass your own readiness gate.

Your constraints:
- Work within the current site generator's schema and existing component set. Reuse the strongest fitting theme or choose the closest theme already available.
- Preserve every meaningful public page you can find. If the source has five public pages, your output should also account for those five pages unless one is pure CMS chrome or a duplicate.
- Preserve all reasonable copy. You may condense repetitive boilerplate, but do not silently drop unique promises, service details, bios, dates, addresses, hours, contact details, pricing signals, event details, linked destinations, or proof points.
- Preserve important images. Keep source image URLs when needed, carry over alt-worthy meaning, and record where each retained image was mapped.
- Preserve important metadata and page details, including page titles, descriptions, canonical URLs when available, contact information, business facts, notable outbound links, and exact dates.
- Use exact dates and facts from the source. Do not convert them into vague relative phrasing like "next month" or "coming soon."
- Do not invent capabilities that are not supported by the current generator. When the generator cannot represent something exactly, map it to the closest supported structure and call out the gap plainly.

Required workflow:

1. Source inventory
- Crawl or inspect the full public site navigation and obvious linked public pages.
- If an auto researcher is available, you may use it as a discovery aid to widen page and asset coverage, especially when the source site has weak navigation, footer-only pages, or brittle markup.
- Treat auto researcher output as a lead list to verify, not as proof that coverage is complete.
- Cross-check header navigation, footer navigation, contact/about links, and obvious in-content public links so low-traffic pages are not skipped just because they are not featured on the homepage.
- Produce a page inventory with:
  - URL
  - page purpose
  - key copy to retain
  - images/media to retain
  - notable metadata or details
- Produce an image retention ledger with:
  - source page
  - image URL
  - why it matters
  - where it will appear in the redesigned output
- Produce a source coverage note that lists any public page, asset, or linked destination you could not inspect fully and why.

2. Mapping plan
- Choose the best existing theme from this repo and explain why.
- Map each source page into the generator structure page by page.
- For each source page, name the destination page or section where its retained content will live.
- Reuse shared site-level layout components when content is genuinely repeated across pages.
- Prefer preserving substance over decorative churn. The redesign should improve clarity and presentation, not erase the original business story.

3. Build the output
- Produce a complete `site.json` style payload that fits this repo's schema.
- Include every mapped page.
- Preserve meaningful descriptions, canonical URLs, CTAs, addresses, emails, phone numbers, hours, and important external links.
- Preserve meaningful images as `media` components or the closest supported equivalent.

4. Steelman review before declaring readiness
- Assume a skeptical reviewer is trying to prove the redesign dropped important content.
- Compare the source inventory against the output page by page.
- Cite the output page or section that carries each retained source page and each retained image.
- Do not treat an auto researcher summary as sufficient evidence on its own; the final audit must still map retained content into the generated output.
- List anything that was condensed, normalized, or omitted.
- For each omission, explain whether it was duplicated boilerplate, unsupported CMS chrome, broken source markup, or a true limitation in the current generator.
- If an image, page, or site detail from the source is not clearly represented, the work is not ready.
- If you could not fully inspect a meaningful public page or required asset, the work is not ready.

5. Readiness gate
- Only say "ready for customer review" if all of the following are true:
  - every meaningful public page is accounted for
  - all important images are retained or explicitly explained
  - all unique business details and strong copy points are retained or explicitly explained
  - all unsupported source elements are listed in a gap ledger
  - any source inspection limits are listed plainly
  - the final output matches the source site facts and uses exact dates where relevant
- If any of those checks fail, do not say it is ready. Revise the output first.

Required final output format:

1. "Source inventory"
- page-by-page inventory
- image retention ledger

2. "Design and mapping decisions"
- chosen theme and rationale
- page mapping notes

3. "Generated site content"
- one complete JSON block only

4. "Steelman check"
- page-by-page retention audit
- image retention audit
- omitted or normalized details with reasons
- gap ledger for unsupported source elements

5. "Readiness verdict"
- either "ready for customer review" or "not ready"
- a short reason tied directly to the checks above

Quality bar:
- The redesign should feel intentional and cleaner than the source, but never at the cost of losing customer-relevant substance.
- When forced to choose, keep more source truth, not less.
```
