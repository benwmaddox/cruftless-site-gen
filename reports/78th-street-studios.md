# 78th Street Studios test-site report

Source pages reviewed on March 30, 2026:

- https://78thstreetstudios.com/
- https://78thstreetstudios.com/about

## Approach used

I kept the work in the dedicated example fixture at `content/examples/78th-street-studios.json` so the default LaunchKit sample still stays intact. The example builds only the requested `/` and `/about` pages.

I used the live site as source material, but translated it into the current component model instead of adding new renderer primitives. This pass uses the richer component set that now exists in the repo:

- `hero` for the site pitch and page-level calls to action
- `media` for real production-hosted image URLs from the live site
- `prose` for the longer about-page narrative
- `feature-grid` and `feature-list` for grouped highlights and history notes
- `cta-band` for live-site follow-through links

I also added a dedicated `studio-industrial` theme so the sample gets materially closer to the live site's warm, warehouse-like atmosphere instead of reusing a generic product theme.

As of March 30, 2026, the live homepage was promoting Friday, April 17, 2026 as the next Third Fridays date, so that exact date is captured in the example rather than a relative "next up" phrase.

## What worked well

- The current schema is now strong enough to build a convincing two-page sample from a real arts venue site without touching the renderer.
- The newer `media` and `prose` components made a noticeable difference. They are what let the sample feel like the production site instead of a text-only summary.
- Theme tokens plus theme-level CSS were enough to push the build much closer to the source site's tone and atmosphere.
- Keeping the work in `content/examples/` and validating it with dedicated tests makes the sample reusable instead of a one-off branch artifact.

## What did not work well

- The live homepage includes a featured Vimeo video, and the generator still cannot represent that directly.
- The live site relies on shared navigation, footer links, grouped tenant directories, and sidebar-style supporting blocks that the current schema cannot model.
- Remote image URLs work for a realistic sample, but the generated output still depends on production-hosted assets instead of copying them into the build.
- Some of the live about-page detail still has to be condensed because the generator favors short, structured sections over richer mixed content.

## Suggestions

- Add a video or embed component so sites like this do not have to flatten featured media into an image plus a nearby link.
- Add a shared navigation and footer model so multi-page samples can feel like full sites instead of isolated page stacks.
- Add a richer long-form content block that supports links, lists, and subheads without requiring raw HTML.
- Add a grouped directory component for rosters like "Who's Inside."
- Add an asset-ingest step that can download approved remote images into `dist/assets` during build.
