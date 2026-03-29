# 78th Street Studios test-site report

Source pages used on 2026-03-29:

- `https://78thstreetstudios.com/`
- `https://78thstreetstudios.com/about`

## Approach

I pulled the live home page and the live `/about` page, then translated that material into the existing strict component set instead of changing the framework to match the old Drupal markup.

The sample lives in `content/examples/78thstreetstudios.json` and keeps the scope to two pages:

- Home page
- About page

The sample keeps the durable parts of the source content:

- The overall positioning of the complex
- The emphasis on Third Fridays
- The Cleveland address and planning details
- The venue-rental call to action
- The building history and broader arts-business mix

I did not copy the live "next up" Third Fridays date into the fixture because that date changes over time and would go stale quickly.

## What worked well

- The current schema is good at turning messy source pages into a small, reviewable content file.
- The existing `hero`, `feature-list`, `feature-grid`, `faq`, and `cta-band` components were enough to ship a believable two-page test site without new rendering code.
- The current build flow made it easy to validate and generate the sample once the content was mapped down to the supported blocks.

## What did not work well

- The source site leans heavily on images, long-form prose, and a large tenant directory. The current generator has no image block, rich-text block, or linked directory/list block, so those sections had to be compressed into summaries.
- Navigation and footer details are not modeled as structured site data today, so important contact and wayfinding details had to be repeated inside page content.
- The current component set is good for summary pages, but it is not strong at preserving detailed editorial structure from an existing site.

## Suggestions

- Add a simple rich-text section for longer editorial copy that should stay grouped.
- Add a linked card or directory component for tenant lists, maps, tours, and similar navigation-heavy content.
- Add an image-capable section so image-led sites can be prototyped without discarding their visual hierarchy.
- Add site-level navigation and footer data so repeated contact and wayfinding details do not need to live inside page components.
