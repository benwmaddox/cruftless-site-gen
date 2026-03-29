# 78th Street Studios Test Site

## Source pages used

- https://78thstreetstudios.com/
- https://78thstreetstudios.com/about

## Approach

I used the current live home page and about page as the source material, then translated that material into the generator's existing JSON component model instead of adding new rendering primitives. The test site lives in `content/78thstreetstudios.json` and stays separate from the default sample content.

I kept the scope to two generated pages:

- `/` for the home page summary
- `/about` for the background, history, and tenant mix summary

The existing `hero`, `feature-list`, `feature-grid`, `faq`, and `cta-band` components were enough to produce a readable first pass, so the framework itself did not need to change for this issue.

## What worked well

- The existing schema is strict enough to keep content tidy and reviewable.
- The build already supports alternate content files, so this test site fit the current workflow cleanly.
- Breaking the source material into short, named sections mapped well to the existing component set.
- Adding an automated build test for this content makes the experiment repeatable inside `npm run check`.

## What did not work well

- The current component set is weak for sites that rely on navigation, directory-style listings, media, and long-form storytelling.
- The live site has a lot of image-driven atmosphere that the current generator cannot express.
- The about page source has more detail than fits comfortably into the current short-field limits, so the generated version has to summarize rather than reproduce.
- There is no shared header, footer, or page-level navigation model, so cross-page wayfinding has to be improvised with buttons.

## Suggestions

- Add a simple shared navigation model so multi-page sites do not need to fake navigation with CTA blocks.
- Add an image or media component because art venues lean heavily on visuals.
- Add a richer long-form content block for history pages that need paragraphs and subheads without forcing everything into card-style components.
- Consider a collection or directory component for tenant rosters, event lists, and grouped links.
