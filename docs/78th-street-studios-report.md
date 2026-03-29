# 78th Street Studios test site report

## Approach used

I used the live home page and live about page as the source material, then rewrote that material into the generator's existing JSON schema instead of trying to scrape and preserve the original HTML.

The generated example lives in `content/examples/78th-street-studios.json` and produces two pages:

- `/`
- `/about`

I kept the scope narrow on purpose. The home page carries the high-level pitch, Third Fridays, and visit cues. The about page carries the main description, building history, and basic visit details.

## What worked well

- The existing `hero`, `feature-list`, `feature-grid`, `faq`, and `cta-band` components were enough to build a credible two-page overview site without touching the renderer.
- The generator is strict enough that the new example can be tested as data, not just as a visual spot check.
- The current themes made it easy to pick a look that feels closer to an arts venue without adding more design code.

## What did not work well

- The source site has a lot of image-driven personality, and this generator has no image component yet, so the test site loses a large part of the original feel.
- The source site also has a deep tenant directory, event details, maps, and navigation paths that do not fit the current narrow content model.
- There is no automated content ingestion step yet, so this was still a manual extraction and rewrite exercise.

## Suggestions

- Add an image or gallery component. That would make this kind of arts-and-events site much easier to represent.
- Add a lightweight header or navigation model so multi-page examples feel less isolated.
- If this repo is meant to turn existing sites into drafts, add a small import step that captures headings, short paragraphs, and links into structured JSON for review.
