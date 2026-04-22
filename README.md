# Cruftless Site Gen

Cruftless Site Gen is a narrow static-site generator for building small marketing and brochure-style sites from strict JSON content.

The project is intentionally opinionated. Content authors choose from a fixed set of components, themes control presentation, validation rejects drift early, and the generated output stays predictable enough to review as normal code.

## What problem this solves

This repo exists to rebuild existing sites into a cleaner format without opening the door to arbitrary template logic or free-form HTML in content files.

The current approach is to keep the authoring surface small and explicit:

- real site migrations are treated as the proving ground, so components need to cover practical brochure-site patterns instead of abstract examples
- themes control more than color tokens, so changing the theme can materially change spacing, typography, surfaces, and visual rhythm
- visually rich and narrative-heavy pages are modeled with structured components such as `media`, `image-text`, `gallery`, and `prose`
- repeated site chrome belongs in shared layout components, with `page-content` marking where each page's own sections render
- location-driven sites can use first-class contact, hours, store-location-hours, and Google Maps components
- JSON Schema output keeps editing ergonomic in VS Code while preserving strict validation at build time

The goal is a system that stays strict, reusable, and reviewable instead of endlessly flexible.

## Core approach

The generator follows a few hard rules:

- Content is data, not templates. Site content lives in JSON under `content/`.
- Components own markup. JSON selects known component types instead of supplying arbitrary HTML.
- Themes own presentation. Content chooses a theme, and optional theme overrides tweak a small controlled surface.
- Validation runs before build output matters. Unknown keys, invalid shapes, stale schema artifacts, CSS token mistakes, and broken examples are all treated as failures.
- Output should stay boring. Stable HTML and CSS are easier to inspect, test, and regenerate.

## Content model

Every site file has two top-level sections:

- `site`: site-wide settings such as name, base URL, theme, theme overrides, optional background image, optional Google Analytics measurement ID, and optional shared layout
- `pages`: page definitions with a slug, title, optional metadata, and an ordered list of components

### Shared layout

If `site.layout.components` is present, those components wrap every page. One item in that layout can be:

- `{ "type": "page-content" }`

That slot is where each page's own `components` array is inserted. This lets the repo reuse headers, nav, shared prose, or footers across every page without copying them into each page object.

### Google Analytics

If `site.googleAnalyticsMeasurementId` is present, every generated page includes the standard Google Analytics loader and `gtag('config', ...)` call for that GA4 measurement ID.

### Available components

The current component set is:

- `before-after`
- `contact`
- `contact-form`
- `cta-band`
- `faq`
- `feature-grid`
- `gallery`
- `google-maps`
- `hero`
- `hours`
- `image-text`
- `logo-strip`
- `media`
- `navigation-bar`
- `prose`
- `store-location-hours`
- `testimonials`

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
        {
          "type": "hero",
          "headline": "Announce your app",
          "primaryCta": {
            "label": "Get started",
            "href": "/contact"
          }
        }
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

That validates `content/site.json`. It now also rejects banned migration/meta wording in publish-facing copy, so phrases like `live site`, `source site`, `this demo`, `the redesign`, and `the rebuild` fail before build output is treated as ready.

To validate everything the repo currently treats as important, use the strict entrypoint:

```bash
npm run validate:strict
```

`npm run check` is an alias for the same full validation run.

To validate a standalone site folder from this generator checkout, point the CLI at the folder. The target folder only needs `content/site.json`; generated files are written under that same folder's `dist/`.

```bash
npm run site:validate -- ../my-site
```

### 3. Edit content in the browser

```bash
npm run edit -- content
```

That starts the local content editor for JSON files under `content/` and prints the browser URL to open. The editor opens `content/site.json` first when it exists, lets you switch to other valid site JSON files, updates the preview from an in-memory draft while you edit, and writes the JSON file only when you press Save.

You can also point it at one JSON file:

```bash
npm run edit -- content/examples/baird-automotive.json
```

To edit a standalone site folder, use:

```bash
npm run edit -- --site-dir ../my-site
```

### 4. Build the default site

```bash
npm run build
```

This reads `content/site.json` and writes the generated site to `dist/`.
If the generated output is already current, the build leaves those files untouched.

To keep rebuilding while you edit a content file, use watch mode:

```bash
npm run build:watch
```

`npm run build:watch` preserves the generated example subtrees in `dist/`, so a normal dev build does not erase the bundled example sites.

To serve the default site and keep the bundled examples rebuilt at the same time, use:

```bash
npm run dev
```

Or watch a specific content file and output directory:

```bash
npm run build -- content/examples/78th-street-studios.json dist/78th-street-studios --watch
```

To build a standalone target folder without adding a project setup to that folder, run:

```bash
npm run site:build -- ../my-site
```

That reads `../my-site/content/site.json` and writes `../my-site/dist/`. If the package is linked or installed as a CLI, the equivalent command is:

```bash
cruftless-site-gen build ../my-site
```

### 5. Build or validate a specific content file

```bash
npm run validate -- content/examples/78th-street-studios.json
npm run build -- content/examples/78th-street-studios.json dist/78th-street-studios
npm run validate -- --site-dir ../my-site
npm run build -- --site-dir ../my-site
```

### 5b. Discover likely first-party page images

```bash
npm run discover:images -- https://example.com/
```

That fetches the page, inspects `og:image` and `twitter:image`, scans inline styles and `<style>` blocks for background images, follows linked stylesheets, and lists deduped image candidates ranked by usefulness.

### 5c. Localize the selected landing image into content

```bash
npm run localize:landing-image -- https://example.com/
```

That downloads the top-ranked candidate into `content/images/landing-page.*`, removes stale `landing-page.*` extension variants in that folder, and rewrites any existing `/content/images/landing-page.*` references in `content/site.json`. Use `--candidate-index 2` or another positive integer when the default ranking is not the image you want.

### 6. Build the bundled example sites

```bash
npm run validate:examples
npm run build:examples
```

During local development, `npm run dev` runs the default site watcher, the theme example watcher, the larger example-site watchers, and the static server together so the generated examples stay available under `dist/`.

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
- same-site relative reference checks in the built `dist/` output

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
