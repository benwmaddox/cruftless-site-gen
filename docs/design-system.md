# Design System & Engineering Principles

This document defines the foundational rules for the Cruftless Site Generator. Any change to the layout, spacing, or component structure must align with these principles.

## 1. The Alignment & Section Standard

Every component must sit within a standardized floating card. This is achieved via the `.l-section` layout class.

### A. The Section Card (.l-section)
Every component's root element must use the `.l-section` class. This class defines the primary visual container for the site.

- **Constraint**: `width: calc(100% - (var(--space-md) * 2)); max-width: var(--max-width); margin-inline: auto;`
- **Aesthetic**:
  - `background: var(--surface)`.
  - `border: 1px solid var(--border)`.
  - `border-radius: var(--radius)`.
  - `box-shadow: var(--shadow)`.
  - `padding: var(--space-xl)`.

### B. Section Modifiers
- **.l-section--hero**: For the Hero component, providing increased padding (`var(--space-2xl)`).

### C. The Layout Cells (.l-item)
Nested items inside a section card (e.g., feature items, FAQ items) should use the `.l-item` class to create visual depth without clutter.

- **Rule**: Items use `background: var(--bg)` and `border-radius: var(--radius)` but **must not** have their own borders or shadows by default. They should feel like "cut-outs" within the parent section card.

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

## 5. Background & Textures (The "Card & Cell" Model)

To provide visual depth without clutter, we use a layered architecture where sections appear as cohesive cards with internal divisions.

### A. The Decorative Stage (Body)
The `body` element carries the theme's background pattern. This remains visible between sections and in the gutters on desktop.

### B. The Section Cards (__inner)
Every component's `__inner` wrapper acts as the **primary floating card**.

- **Aesthetic**:
  - `background: var(--surface)`.
  - `border: 1px solid var(--border)`.
  - `border-radius: var(--radius)`.
  - `box-shadow: var(--shadow)`.
  - `padding: var(--space-xl)`.

### C. The Section Cells (Nested Items)
To avoid "boxes within boxes" clutter, items inside a section card (e.g., feature items, FAQ items) act as simplified **cells**.

- **Rule**: Nested items should use `background: var(--bg)` and `border-radius: var(--radius)` but **must not** have their own borders or shadows. They should feel like "cut-outs" within the section card.

### Spacing Rules:
- **Vertical Rhythm**: The global `.l-page` container provides the spacing between cards using `gap: var(--space-xl)`.
- **Inner Breathing Room**: Cards provide their own internal vertical padding via `padding-block: var(--space-xl)`.
