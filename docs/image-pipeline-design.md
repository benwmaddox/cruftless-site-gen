# Image Pipeline Design

## Goals

- keep shipped image assets sized to their actual UI usage instead of serving original source files directly
- support local-service gallery flows where thumbnail grids open a larger full-size view
- keep JSON authoring simple by deriving most image processing behavior from component usage
- make repeated builds and watch mode efficient when only copy or ordering changes
- keep the implementation portable on Windows and Linux

## Scope

The image pipeline applies to local file-based images referenced from JSON content. These are the image references that can be resized or optimized during build:

- `media`
- `image-text`
- `feature-grid`
- `before-after`
- `gallery`
- `testimonials`
- `navigation-bar.brandImage`

Remote URLs, `data:` URLs, and already-published `assets/...` URLs remain pass-through. They are rendered as-is and are not transformed.

## Policy

### Source asset policy

- authors may keep a master/original image larger than any shipped site variant
- the build never ships the original by default for local raster assets
- SVG assets are treated as source assets and may pass through when raster resizing would be the wrong output

### Shipped variant policy

- each component usage maps to a named usage preset
- each preset defines a maximum shipped width
- the maximum shipped width should be approximately the largest rendered slot width multiplied by `2`
- a gallery item can additionally request a larger `full` variant for modal viewing

### Validation policy

- if a local source image path does not exist, validation fails
- if a local image uses an unsupported source format, validation fails
- if a local raster source image is smaller than the largest required minimum width for any non-`full` usage, validation fails
- if a local image is used in multiple places, validation compares the source against the largest required minimum width

## Presets

The initial build presets are:

- `navbar-brand`: `320px`
- `feature-grid-inline`: `640px`
- `feature-grid-stacked`: `960px`
- `media-content`: `1280px`
- `media-wide`: `1600px`
- `image-text`: `1200px`
- `before-after-panel`: `960px`
- `gallery-thumb-2`: `720px`
- `gallery-thumb-3`: `560px`
- `gallery-thumb-4`: `420px`
- `gallery-full`: `1920px`
- `testimonial-avatar`: `256px`

These presets are build concerns, not content concerns.

## Build-time behavior

### Local raster images

For local raster images:

1. the build reads source metadata
2. the build validates the source size against the required preset(s)
3. the build writes processed files into `dist/assets/images/`
4. output file names are deterministic and keyed by:
   - source relative path
   - source mtime
   - preset name
5. the renderer uses the processed output URL instead of the original source path

### Local SVG images

For local SVG images:

- default behavior is to copy the source asset to the output and use it directly
- no raster derivative is required for the initial implementation
- gallery modal still works, but the full-size target is the copied SVG asset

### Remote and data URLs

- no validation against file metadata
- no resizing
- no variant generation
- render as-is

## Gallery interaction

Gallery should render as:

- processed thumbnail image in the grid
- clickable control around the thumbnail
- lightweight modal/lightbox overlay using the existing shared page script bundling
- full-size asset in the overlay

The initial interaction should stay simple:

- click opens modal
- Escape closes modal
- clicking backdrop closes modal

## Watch mode and efficiency

### Caching

Processed outputs should be skipped when the transform key is unchanged.

The key should include:

- source path
- source mtime
- preset name

This lets frequent JSON edits reuse existing transformed images when:

- text changes
- captions change
- section order changes
- CTA changes

### Watching dependencies

Watch mode should monitor:

- the JSON content file
- all referenced local image files for the latest successfully parsed content

When JSON changes:

- re-parse the content
- update the watched image file set
- rebuild using cached transforms when possible

When a watched local image changes:

- rebuild the same content file

## Cross-platform implementation

- use `sharp` as a normal npm dependency
- rely on Sharp's supported prebuilt packages for Windows and Linux
- avoid shelling out to platform-specific image tools
- keep paths normalized through Node path utilities only

## Initial implementation choices

- local raster images are resized and optimized
- local SVG images are copied through untouched
- gallery gets thumbnail + modal full-size support
- other image-bearing components get a single processed display variant
- variant selection is derived from component usage, not additional JSON authoring fields

## Future extensions

- add `srcset` and `sizes`
- add AVIF/WebP multi-format outputs
- add optional low-quality placeholders
- add shared asset identity so the same source image can declare editorial metadata once and be reused by reference
