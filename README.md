# Cruftless Site Gen

Cruftless Site Gen is a narrow static-site generator for building small marketing and brochure-style sites from strict JSON content.

The project is intentionally opinionated. Content authors choose from a fixed set of components, themes control presentation, validation rejects drift early, and the generated output stays predictable enough to review as normal code.

## What problem this solves

This repo exists to rebuild existing sites into a cleaner format without opening the door to arbitrary template logic or free-form HTML in content files.

The early issue history shaped that direction:

- issue `#5` pushed the repo toward real migrations by rebuilding 78th Street Studios as a test site and writing down what worked
- issue `#9` made themes do more than swap colors, so theme choice materially changes the look and feel
- issue `#10` added `media` and `prose`, which made visually rich and narrative-heavy pages fit the system better
- issue `#13` added generated JSON Schema support so editing content in VS Code can stay ergonomic
- issue `#21` added shared site-level layout with a `page-content` slot for repeated navigation, headers, or footers
- issue `#22` added a Google Maps component so location-driven sites can keep an embedded map

The result is a system that aims to be strict, reusable, and reviewable instead of endlessly flexible.

## Core approach

The generator follows a few hard rules:

- Content is data, not templates. Site content lives in JSON under `content/`.
- Components own markup. JSON selects known component types instead of supplying arbitrary HTML.
- Themes own presentation. Content chooses a theme, and optional theme overrides tweak a small controlled surface.
- Validation runs before build output matters. Unknown keys, invalid shapes, stale schema artifacts, CSS token mistakes, and broken examples are all treated as failures.
- Output should stay boring. Stable HTML and CSS are easier to inspect, test, and regenerate.

## Content model

Every site file has two top-level sections:

- `site`: site-wide settings such as name, base URL, theme, theme overrides, optional background image, and optional shared layout
- `pages`: page definitions with a slug, title, optional metadata, and an ordered list of components

### Shared layout

If `site.layout.components` is present, those components wrap every page. One item in that layout can be:

- `{ "type": "page-content" }`

That slot is where each page's own `components` array is inserted. This lets the repo reuse headers, nav, shared prose, or footers across every page without copying them into each page object.

### Available components

The current component set is:

- `hero`
- `feature-list`
- `feature-grid`
- `faq`
- `cta-band`
- `google-maps`
- `media`
- `navigation-bar`
- `prose`

### Available themes

The current built-in themes are:

- `corporate`
- `brutalism`
- `workshop`
- `refined-professional`
- `friendly-modern`
- `heritage-local`
- `wellness-calm`
- `high-vis-service`

## Example content shape

This is the rough shape of a site file:

```json
{
  "site": {
    "name": "LaunchKit",
    "baseUrl": "https://launchkit.example",
    "theme": "friendly-modern",
    "layout": {
      "components": [
        { "type": "navigation-bar", "brandText": "LaunchKit", "links": [] },
        { "type": "page-content" }
      ]
    }
  },
  "pages": [
    {
      "slug": "/",
      "title": "LaunchKit",
      "components": [
        { "type": "hero", "headline": "Announce your app" }
      ]
    }
  ]
}
```

For real examples, inspect:

- `content/site.json`
- `content/examples/78th-street-studios.json`
- `content/examples/baird-automotive.json`
- `content/examples/themes/*.json`

## How to use it

### 1. Install dependencies

This repo expects Node.js 20 or newer.

```bash
npm install
```

### 2. Validate the default site content

```bash
npm run validate
```

That validates `content/site.json`.

To validate everything the repo currently treats as important, use the strict entrypoint:

```bash
npm run validate:strict
```

`npm run check` is an alias for the same full validation run.

### 3. Build the default site

```bash
npm run build
```

This reads `content/site.json` and writes the generated site to `dist/`.

### 4. Build or validate a specific content file

```bash
npm run validate -- content/examples/78th-street-studios.json
npm run build -- content/examples/78th-street-studios.json dist/78th-street-studios
```

### 5. Build the bundled example sites

```bash
npm run validate:examples
npm run build:examples
```

There are also dedicated commands for the larger example migrations:

```bash
npm run validate:example:78th
npm run validate:example:baird
npm run build:example:78th
npm run build:example:baird
```

## Recommended authoring workflow

1. Start from `content/site.json` or copy one of the example files.
2. Pick the closest existing theme before adding new styling ideas.
3. Model each section with an existing component instead of trying to bypass the schema.
4. Run `npm run validate` on the file you are editing.
5. Run `npm run build` and inspect the generated output in `dist/`.
6. Run `npm run validate:strict` before treating the work as ready.

## JSON Schema and VS Code support

The repo can generate a JSON Schema and matching VS Code settings for files under `content/**/*.json`.

```bash
npm run schema:generate
```

That updates:

- `schemas/site-content.schema.json`
- `.vscode/settings.json`

To check that the generated artifacts are current without rewriting them:

```bash
npm run schema:check
```

## Validation philosophy

The strict validation entrypoint is meant to catch real regressions, not just syntax mistakes. Today it covers:

- generated schema freshness
- TypeScript type-checking
- CSS linting
- unit tests
- browser-level navigation coverage
- default-site validation
- example-site validation
- default-site build
- example-site builds

If you change the schema, component registry, theme tokens, renderer behavior, or example content, run `npm run validate:strict`.

## Repo layout

- `content/`: source JSON for the default site and examples
- `src/components/`: component schemas, renderers, CSS, and tests
- `src/themes/`: theme definitions and theme CSS emission
- `src/build/`: CLI entrypoints for build, validation, examples, and schema generation
- `src/schemas/`: Zod schemas and JSON Schema generation helpers
- `src/layout/`: shared layout logic, including the `page-content` slot
- `tests/`: repo-level tests
- `docs/`: supporting prompts and workflow docs
- `reports/`: write-ups from migration experiments and mapping work

## Current limits

This repo is intentionally narrow, and that means some tradeoffs are deliberate:

- no arbitrary HTML blocks in JSON
- no full CMS or template language
- only the current component set is available unless the codebase is extended
- remote media URLs are allowed, but the build does not currently ingest them into local assets
- some richer source-site structures still need to be flattened into the nearest supported component model

## Migration and redesign work

If you are using this repo to recreate an existing public website, start with:

- `docs/redesign-one-shot-prompt.md`

That prompt documents the expected migration workflow: source inventory, page mapping, generated JSON output, steelman review, and readiness gate.
