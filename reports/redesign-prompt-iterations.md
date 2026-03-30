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

### Residual risk

- The prompt still depends on the model actually being able to inspect the source site thoroughly.
- If the source site hides pages behind script-only navigation or blocked assets, the model can only be as complete as the source inspection step allows.
- The generator still cannot perfectly represent every source-site feature, so the gap ledger remains necessary.

### Verdict

High quality. This is the first version that is strong enough to use as the default prompt.

## Final recommendation

Use the prompt in `docs/redesign-one-shot-prompt.md` as the default one-shot redesign prompt for this repo.

It went well overall. The fastest improvement came from treating missing-page risk and missing-image risk as prompt design failures instead of output cleanup tasks. The smallest repeatable process fix that made the next iteration better was simple: require the source inventory and the steelman audit before allowing any readiness claim.
