import { z } from "zod";

import { editorFor } from "./editor-for.js";
import { defineEditorRegistry } from "./registry.js";

const heroSchema = z
  .object({
    type: z.literal("hero"),
    heading: z.string(),
    subheading: z.string().optional(),
    imageUrl: z.string().optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().optional(),
    align: z.enum(["start", "center"]).default("start"),
  })
  .strict();

type HeroData = z.infer<typeof heroSchema>;

const heroDefaults = {
  type: "hero",
  heading: "",
  subheading: "",
  imageUrl: "",
  featured: false,
  sortOrder: 0,
  align: "start",
} satisfies HeroData;

const proseSchema = z
  .object({
    type: z.literal("prose"),
    title: z.string().optional(),
    content: z.string(),
    paragraphs: z.array(z.string()),
  })
  .strict();

type ProseData = z.infer<typeof proseSchema>;

const proseDefaults = {
  type: "prose",
  title: "",
  content: "",
  paragraphs: [],
} satisfies ProseData;

const gallerySchema = z
  .object({
    type: z.literal("gallery"),
    title: z.string().optional(),
    imageUrls: z.array(z.string()),
  })
  .strict();

type GalleryData = z.infer<typeof gallerySchema>;

const galleryDefaults = {
  type: "gallery",
  title: "",
  imageUrls: [],
} satisfies GalleryData;

const hero = editorFor(heroSchema, "type");
const prose = editorFor(proseSchema, "type");
const gallery = editorFor(gallerySchema, "type");

hero.readonly("type");
hero.text("heading", "Heading");
hero.textarea("subheading", "Subheading");
hero.number("sortOrder", "Sort order");
hero.checkbox("featured", "Featured");
hero.select("align", "Alignment", [
  { label: "Start", value: "start" },
  { label: "Center", value: "center" },
]);

// @ts-expect-error invalid key
hero.text("header", "Heading");

// @ts-expect-error wrong helper for string field
hero.checkbox("heading", "Heading");

// @ts-expect-error wrong helper for boolean field
hero.text("featured", "Featured");

// @ts-expect-error select option is not allowed by the enum schema
hero.select("align", "Alignment", [{ label: "End", value: "end" }]);

gallery.stringList("imageUrls", "Images");

// @ts-expect-error title is not a string array
gallery.stringList("title", "Title");

export const heroEditor = hero.object({
  type: "hero",
  title: "Hero",
  defaults: heroDefaults,
  fields: [
    hero.section("Main", [
      hero.readonly("type"),
      hero.text("heading", "Heading"),
      hero.textarea("subheading", "Subheading"),
      hero.checkbox("featured", "Featured"),
      hero.number("sortOrder", "Sort order"),
    ]),
    hero.section("Media", [hero.text("imageUrl", "Image URL")]),
  ],
});

export const proseEditor = prose.object({
  type: "prose",
  title: "Prose",
  defaults: proseDefaults,
  fields: [
    prose.section("Content", [
      prose.readonly("type"),
      prose.text("title", "Title"),
      prose.textarea("content", "Content"),
      prose.stringList("paragraphs", "Paragraphs"),
    ]),
  ],
});

export const galleryEditor = gallery.object({
  type: "gallery",
  title: "Gallery",
  defaults: galleryDefaults,
  fields: [
    gallery.section("Content", [
      gallery.readonly("type"),
      gallery.text("title", "Title"),
      gallery.stringList("imageUrls", "Images"),
    ]),
  ],
});

const componentSchema = z.discriminatedUnion("type", [heroSchema, proseSchema, gallerySchema]);

defineEditorRegistry(componentSchema, {
  hero: heroEditor,
  prose: proseEditor,
  gallery: galleryEditor,
});

// @ts-expect-error missing gallery editor
defineEditorRegistry(componentSchema, {
  hero: heroEditor,
  prose: proseEditor,
});

defineEditorRegistry(componentSchema, {
  // @ts-expect-error editor type does not match registry key
  hero: proseEditor,
  // @ts-expect-error editor type does not match registry key
  prose: heroEditor,
  gallery: galleryEditor,
});

defineEditorRegistry(componentSchema, {
  hero: heroEditor,
  prose: proseEditor,
  gallery: galleryEditor,
  // @ts-expect-error extra editor key is not part of the discriminated union
  heroo: heroEditor,
});
