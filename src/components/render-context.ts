import type { ImageReferenceData } from "../schemas/shared.js";

export const componentImageUsageNames = [
  "before-after-panel",
  "feature-grid-inline",
  "feature-grid-stacked",
  "gallery-full",
  "gallery-thumb-2",
  "gallery-thumb-3",
  "gallery-thumb-4",
  "image-text",
  "page-background",
  "media-content",
  "media-wide",
  "navbar-brand",
  "testimonial-avatar",
] as const;

export type ComponentImageUsage = (typeof componentImageUsageNames)[number];

export interface ResolvedImageData {
  src: string;
  width?: number;
  height?: number;
  fullSrc?: string;
  fullWidth?: number;
  fullHeight?: number;
}

export interface ResponsiveImageData extends ResolvedImageData {
  sizes?: string;
  srcset?: string;
}

export interface ComponentRenderContext {
  resolveImage: (
    image: Pick<ImageReferenceData, "src" | "width" | "height">,
    usage: ComponentImageUsage,
  ) => ResolvedImageData;
  resolveGalleryImage: (
    image: Pick<ImageReferenceData, "src" | "width" | "height">,
    columns: "2" | "3" | "4",
  ) => ResolvedImageData;
  resolveResponsiveImage?: (
    image: Pick<ImageReferenceData, "src" | "width" | "height">,
    usage: "media-content" | "media-wide",
  ) => ResponsiveImageData | undefined;
}

export const defaultComponentRenderContext: ComponentRenderContext = {
  resolveImage: (image) => ({
    src: image.src,
    width: image.width,
    height: image.height,
  }),
  resolveGalleryImage: (image) => ({
    src: image.src,
    width: image.width,
    height: image.height,
    fullSrc: image.src,
    fullWidth: image.width,
    fullHeight: image.height,
  }),
};
