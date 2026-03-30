# Reports

## 78th Street Studios sample build

Source reviewed on March 30, 2026:

- `https://78thstreetstudios.com/`
- `https://78thstreetstudios.com/about`

Approach used:

- Replaced the demo content with a two-page sample for `/` and `/about`.
- Added a dedicated `studio-industrial` theme so the generated pages feel closer to the live site's warm, industrial, image-led presentation.
- Reused live remote image URLs from the production site instead of placeholder art.
- Paraphrased the live site copy into the current schema so the sample stays realistic without pretending the generator already supports the source site's full markup.

What worked well:

- The existing `hero`, `media`, `prose`, `feature-grid`, `feature-list`, and `cta-band` components were enough to capture the building story, the monthly event emphasis, and the visual atmosphere.
- Theme tokens plus theme-level CSS were enough to get materially closer to the live site's palette and tone without changing the renderer.
- The current validation and build pipeline was already deterministic. `npm run check` is a strong bounded entrypoint for this repo.

What did not work well:

- The current schema cannot represent the live homepage video embed. The sample can only link out or imply it through adjacent content.
- The current schema cannot model the live site's navigation, footer links, venue directory, sidebar blocks, or rich mixed-content body with inline links and long lists.
- Remote image URLs work for a sample, but the generated site still depends on production-hosted assets instead of copying them into local build output.
- Recurring event data is still hard-coded into prose and CTA text. There is no event/date component or external data feed.

Suggestions:

- Add a video or embed component for cases like the Vimeo feature on the live homepage.
- Add a structured navigation/footer layer so a generated site can feel more like a full site and less like a stack of sections.
- Add a richer long-form content component that supports links, lists, and subheads without falling back to raw HTML.
- Add an asset-ingest step that can download approved remote images into `dist/assets` during build.
- Add a roster or directory component for pages like "Who's Inside" where the live site is driven by grouped lists of tenants and studios.
