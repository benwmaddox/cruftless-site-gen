# 78th Street Studios test site report

## Source pages used

- https://78thstreetstudios.com/
- https://78thstreetstudios.com/about

## Approach used

I used the current live home page and about page as the source material, then translated that material into the generator's existing JSON component model instead of adding new rendering primitives. The test site lives in `content/examples/78th-street-studios.json` and stays separate from the default sample content.

I kept the scope to two generated pages:

- `/` for the home page summary
- `/about` for the background, history, and tenant mix summary

The current `hero`, `feature-list`, `feature-grid`, `faq`, and `cta-band` components were enough to produce a readable first pass, so the framework itself did not need to change for this issue.

## What worked well

- The current JSON schema made it straightforward to build a clean, bounded prototype from real site copy.
- The existing build commands already accept an alternate content file and output directory, so no build-system change was needed.
- Breaking the source material into short, named sections mapped well to the current component set.
- The stricter test coverage makes this fixture part of routine validation instead of an afterthought.

## What did not work well

- The live site is content-heavy and media-heavy, while the generator currently only supports a few text-first components.
- The current component set is still weak for sites that rely on navigation, directory-style listings, media, and long-form storytelling.
- The live site has a lot of image-driven atmosphere that the current generator cannot express.
- The about page source has more detail than fits comfortably into the current short-field limits, so the generated version has to summarize rather than reproduce.
- There is no first-class navigation, footer, image, or gallery model, so the prototype captures message and structure, not visual parity with the source site.

## Suggestions

- Add a simple shared navigation model so multi-page sites do not need to fake navigation with CTA blocks.
- Add an image or media component because art venues lean heavily on visuals.
- Add a richer long-form content block for history pages that need paragraphs and subheads without forcing everything into card-style components.
- Consider a collection or directory component for tenant rosters, event lists, and grouped links.
