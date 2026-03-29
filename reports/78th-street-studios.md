# 78th Street Studios test site report

## Approach used

I pulled the existing homepage and About page HTML from the live site, then translated the factual copy into the generator's existing structured components instead of trying to mirror the Drupal markup. The resulting fixture lives at `content/examples/78th-street-studios.json` and generates two pages: `/` and `/about`.

The mapping was intentionally simple:

- Home page copy became a hero, a summary grid, and one call-to-action band.
- About page copy became a hero, two summary grids, and one call-to-action band.
- I kept the source links pointing back to the live site anywhere the prototype needed details that the current schema does not model directly, including the date-specific Third Fridays note shown on the live homepage when I fetched it on March 28, 2026.

I also tightened the regression coverage so the normal test suite validates and builds every JSON content fixture under `content/`, including this one, instead of relying on a one-off manual command.

## What worked well

- The current JSON schema made it straightforward to build a clean, bounded prototype from real site copy.
- The existing build commands already accept an alternate content file and output directory, so no build-system change was needed.
- The available components are enough for a concise marketing-style homepage and a summarized About page, even without adding any new renderer code.
- The stricter test coverage makes this fixture part of routine validation instead of an afterthought.

## What did not work well

- The live site is content-heavy and media-heavy, while the generator currently only supports a few text-first components.
- The homepage includes changing event data. As fetched on March 28, 2026, it showed the next Third Fridays date as April 17, 2026. I could mention that in copy, but there is still no dedicated event/date component, so that kind of data would be brittle in a real migration.
- The About page contains long-form history, inline links, and a large tenant roster. That all had to be compressed because there is no rich-text, media, or collection component for those shapes yet.
- There is no first-class navigation, footer, image, or gallery model, so the prototype captures message and structure, not visual parity with the source site.

## Suggestions

- Add a small fixture catalog and treat real-site examples as permanent regression inputs.
- Add at least one image-capable content block and one richer text section for historical or editorial pages.
- Add optional site-wide navigation and footer content to make two-page prototypes feel more complete.
- If importing existing sites is a recurring task, add a helper step that extracts headline, paragraph, and link candidates from fetched HTML before manual cleanup.
