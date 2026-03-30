# Site redesign prompt iteration report

## Finishing criteria

- Deliver one reusable prompt that can drive a one-shot redesign into this repo's site generator format.
- Force page retention, copy retention, image retention, and explicit gap reporting.
- Force a steelman review before the model can say the result is ready for customer review.
- Test the prompt against real examples already represented in this repo.
- Stop iterating once the prompt quality is high enough to survive those checks without obvious retention gaps.

## Test method

I tested the prompt against the two grounded source-to-generator migrations already in this repo:

- Baird Automotive
- 78th Street Studios

Those examples already show the kind of output this generator can support, including page retention, remote image preservation, shared layout reuse, and explicit notes about unsupported source features. I used them as the reference cases for prompt quality.

For each iteration, I checked whether the prompt would force an LLM to preserve:

- all meaningful public pages
- business-critical copy and facts
- important images and where they landed
- page metadata and strong outbound links
- unsupported features called out as gaps instead of silently dropped
- a clear "ready" or "not ready" verdict after a skeptical self-review

## Iteration 1

### Prompt shape

The first version asked for a redesign into the repo's JSON format while preserving copy and images.

### What went well

- It set the basic goal correctly.
- It pushed toward a complete JSON deliverable instead of vague recommendations.
- It recognized that the redesign should improve presentation without rewriting the source from scratch.

### What failed

- It did not explicitly require a full page inventory first, so a model could skip low-visibility pages like Baird Automotive's community page.
- It did not require an image ledger, so image retention could degrade into a best-effort guess.
- It did not force a page-by-page self-audit, which meant a model could say the work was finished without proving coverage.

### Verdict

Not good enough. Too much room for silent loss.

## Iteration 2

### What changed

I added:

- a required source inventory
- an image retention ledger
- a gap ledger for unsupported source elements
- explicit instructions to preserve canonical URLs, descriptions, contact details, hours, and exact dates

### What improved

- This would have protected the Baird Automotive five-page scope more reliably.
- It also would have better protected 78th Street Studios' remote images, event date, and about-page building history.
- Unsupported elements like embedded video, persistent nav chrome, or grouped tenant directories would now be reported instead of disappearing without explanation.

### What still failed

- The prompt still did not make the model argue against itself strongly enough before saying the work was ready.
- A model could still satisfy the letter of the prompt with a broad summary instead of a skeptical retention audit.

### Verdict

Closer, but still not high quality.

## Iteration 3

### What changed

I added a hard steelman phase and a stricter readiness gate:

- the model must assume a skeptical reviewer is trying to prove it dropped something important
- the model must compare source inventory against output page by page
- the model must list every condensed, normalized, or omitted detail with a reason
- the model cannot say "ready for customer review" unless pages, images, facts, and gaps are all accounted for

### What improved

- This closes the main failure mode from Iteration 2: unsupported confidence.
- It matches the way the existing Baird Automotive and 78th Street Studios reports already describe what mapped cleanly and what did not.
- It makes image retention and page retention first-class checks instead of side notes.
- It gives a future reviewer a concrete audit trail instead of a trust-me answer.

### What still failed

- The prompt still depended too heavily on a model's idea of "the full site navigation."
- A model could still miss footer-only pages, contact-page outbound links, or low-traffic pages that were only linked from body copy.
- It also did not say what to do when source inspection itself was incomplete, which left too much room for a premature "ready" verdict.

### Verdict

Better, but still not strong enough.

## Iteration 4

### What changed

I hardened the source-inspection phase:

- require a cross-check against header navigation, footer navigation, contact/about links, and obvious in-content public links
- require a source coverage note for any page, asset, or linked destination that could not be inspected fully
- block a "ready" verdict if a meaningful page or required asset could not be inspected

### What improved

- This closes a real blind spot from the earlier versions: many small business sites bury meaningful pages outside the homepage and primary nav.
- It would better protect Baird Automotive's lower-visibility community material and similar footer-only pages on future migrations.
- It also makes source-access limits explicit instead of letting the model quietly assume completeness.

### What still failed

- The prompt still did not force enough traceability from source material into the final output.
- A model could claim that a page or image was retained without clearly naming where that retained content landed in the generated site.

### Verdict

Stronger, but traceability was still too loose.

## Iteration 5

### What changed

I tightened the mapping and audit requirements:

- require each source page to name the destination page or section where its retained content will live
- require the steelman review to cite the output page or section that carries each retained source page and each retained image
- keep the explicit image ledger, gap ledger, and readiness gate from earlier iterations

### What improved

- This turns retention from a promise into a checkable mapping.
- It gives a reviewer a direct path from source page to generated section instead of making them infer the mapping.
- It works well with the existing Baird Automotive and 78th Street Studios examples because both already have concrete cases where content is preserved in a different shape than the source.
- It upgrades the final review from a generic self-check into a traceable steelman audit.

### Residual risk

- The prompt still depends on the model actually being able to inspect the source site thoroughly.
- If the source site hides pages behind script-only navigation, blocked assets, or brittle markup, the coverage note can only report that limit; it cannot remove it.
- The generator still cannot perfectly represent every source-site feature, so the gap ledger remains necessary.

### Verdict

High quality. This is the first version that is strong enough to use as the default prompt.

## Final recommendation

Use the prompt in `docs/redesign-one-shot-prompt.md` as the default one-shot redesign prompt for this repo.

Auto researcher makes sense here as an optional source-discovery pre-pass, not as a replacement for the redesign prompt itself.

- It can help surface footer-only pages, weakly linked pages, and assets that a quick manual crawl might miss.
- It is most useful before generation, when the goal is to widen the candidate inventory and reduce source-coverage gaps.
- It is not enough on its own because the final output still needs a page-by-page mapping, an image ledger, a gap ledger, and a steelman audit tied directly to the generated site.

It went well overall. The extra passes were worth doing because the remaining weaknesses were not about tone, they were about evidence: source coverage and mapping traceability. The smallest repeatable process fix that made the next iteration better was simple: once the prompt looked "good enough," force one more pass that asks what proof is still missing before accepting the result.
