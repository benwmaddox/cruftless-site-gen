# Design System & Engineering Principles

This document defines the foundational rules for the Cruftless Site Generator. Any change to the layout, spacing, or component structure must align with these principles.

## 1. The Alignment Standard

Every component must align to a single, global content edge. To achieve this, we follow a two-tier layout system:

### A. The Component Gutter (Root Level)
Every component's root container must provide a horizontal gutter to ensure content never hits the viewport edge on mobile.

```css
.c-component {
  padding-inline: var(--space-md); /* Standard 1rem gutter */
}
```

### B. The Content Constraint (Inner Level)
The inner wrapper (`.__inner`) defines the actual content boundary. It does not have horizontal padding.

```css
.__inner {
  width: 100%;
  max-width: var(--max-width);
  margin-inline: auto;
}
```

### Why this rule exists:
- **Desktop Precision**: On screens wider than the `max-width` plus gutters, every component will be exactly the same width (e.g., 1280px).
- **Mobile Consistency**: Every section shares the same gutter, ensuring their edges line up perfectly as the screen shrinks.
- **Background Integrity**: The component root remains 100% wide, allowing backgrounds and textures to fill the viewport while content remains safely indented.

## 2. Layout Architecture (The "Chrome" Rule)

The HTML structure is strictly divided between **Global Chrome** and **Page Content**.

- **Global Chrome**: Components defined in the site-level layout (e.g., Navigation Bar, Footer) sit at the top level of the `<body>`.
- **Page Content**: Components specific to a page are wrapped in a `<main class="l-page">` element.

### Spacing Rules:
- **Vertical Rhythm**: Vertical breathing room is controlled via `padding-block`. We favor a compact rhythm to ensure content remains the focus.
- **Standard Vertical Padding**: Most components should use `padding-block: var(--space-xl)` (default 3rem) for balanced separation.
- **Hero Separation**: The Hero component may use `padding-block: var(--space-2xl)` (default 5rem) for greater emphasis.
- **No Redundant Padding**: Themes must avoid adding significant `padding-block` to the `.l-page` container if components already provide sufficient vertical margins, preventing "stacking" of empty space.

## 3. Theme-Token Relationship

Themes are defined by a strict set of tokens, but can provide surgical CSS overrides.

- **Tokens First**: All layouts must use `var(--space-*)` and `var(--size-*)` tokens. Hard-coded rem/px values in components are forbidden.
- **Gutter Token**: `--space-md` (default `1rem`) is the standard horizontal gutter for all content.
- **Section Spacing**: `--space-xl` and `--space-2xl` are used for vertical margins between major components.

## 4. Component Encapsulation

- **Padding**: Components that require internal backgrounds or borders (e.g., `cta-band`, `feature-grid` cards) must apply their internal padding *inside* the `__inner` alignment boundary.
- **Borders**: Component-specific borders and shadows should be applied to the `__inner` container or its child elements, never to the section container itself.

## 5. Background & Textures (The "Framed Stage")

To ensure visual depth without sacrificing readability, we use a two-layer background architecture:

### A. The Decorative Stage (Body)
The `body` element carries the theme's background pattern. This is visible in the gutters (left/right margins) on desktop.

- **Token**: `--theme-pattern` (Default: `none`). Stores an SVG data URI or gradient.
- **Overrides**: Users can override this pattern by providing a background image via `--site-page-background-image`.

### B. The Content Sheet (Main)
The `<main class="l-page">` element acts as a solid "sheet" of content.

- **Style**: `background: var(--bg)`.
- **Constraint**: It is centered and constrained to `var(--max-width)`.
- **Readability**: This ensures text is always rendered on a solid, clean surface, regardless of how complex the body pattern is.

### Spacing Rules:
- **Vertical Rhythm**: Vertical breathing room is controlled via `padding-block`.
- **Standard Vertical Padding**: Most components should use `padding-block: var(--space-xl)` (default 3rem).
- **Hero Separation**: The Hero component may use `padding-block: var(--space-2xl)` (default 5rem).
