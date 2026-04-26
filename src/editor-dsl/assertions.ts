import { z } from "zod";

import { ComponentSchemaBase } from "../components/index.js";
import { BeforeAfterSchema } from "../components/before-after/before-after.schema.js";
import { ContactSchema } from "../components/contact/contact.schema.js";
import { ContactFormSchema } from "../components/contact-form/contact-form.schema.js";
import { CtaBandSchema } from "../components/cta-band/cta-band.schema.js";
import { FaqSchema } from "../components/faq/faq.schema.js";
import { FeatureGridSchema } from "../components/feature-grid/feature-grid.schema.js";
import { GallerySchema } from "../components/gallery/gallery.schema.js";
import { GoogleMapsSchema } from "../components/google-maps/google-maps.schema.js";
import { HeroSchemaBase } from "../components/hero/hero.schema.js";
import { HoursSchema } from "../components/hours/hours.schema.js";
import { ImageTextSchema } from "../components/image-text/image-text.schema.js";
import { LogoStripSchema } from "../components/logo-strip/logo-strip.schema.js";
import { MediaSchemaBase } from "../components/media/media.schema.js";
import { NavigationBarSchemaBase } from "../components/navigation-bar/navigation-bar.schema.js";
import { ProseSchema } from "../components/prose/prose.schema.js";
import { StoreLocationHoursSchema } from "../components/store-location-hours/store-location-hours.schema.js";
import { TestimonialsSchema } from "../components/testimonials/testimonials.schema.js";
import { SiteSchema } from "../schemas/site.schema.js";
import { editorFor } from "./editor-for.js";
import { defineEditorRegistry } from "./registry.js";

const linkDefaults = {
  label: "Contact",
  href: "/contact",
} as const;

const imageDefaults = {
  src: "/content/example.jpg",
  alt: "Example image",
};

const hoursEntryDefaults = {
  day: "Monday",
  open: "9 AM",
  close: "5 PM",
} as const;

const mapsEmbedUrl = "https://www.google.com/maps/embed?pb=example";

const site = editorFor(SiteSchema, "theme");
const beforeAfter = editorFor(BeforeAfterSchema, "type");
const contact = editorFor(ContactSchema, "type");
const contactForm = editorFor(ContactFormSchema, "type");
const ctaBand = editorFor(CtaBandSchema, "type");
const faq = editorFor(FaqSchema, "type");
const featureGrid = editorFor(FeatureGridSchema, "type");
const gallery = editorFor(GallerySchema, "type");
const googleMaps = editorFor(GoogleMapsSchema, "type");
const hero = editorFor(HeroSchemaBase, "type");
const hours = editorFor(HoursSchema, "type");
const imageText = editorFor(ImageTextSchema, "type");
const logoStrip = editorFor(LogoStripSchema, "type");
const media = editorFor(MediaSchemaBase, "type");
const navigationBar = editorFor(NavigationBarSchemaBase, "type");
const prose = editorFor(ProseSchema, "type");
const storeLocationHours = editorFor(StoreLocationHoursSchema, "type");
const testimonials = editorFor(TestimonialsSchema, "type");

site.text("name", "Name");
site.text("baseUrl", "Base URL");
site.select("theme", "Theme", [{ label: "Corporate", value: "corporate" }]);

hero.readonly("type");
hero.text("headline", "Headline");
hero.textarea("subheadline", "Subheadline");
hero.select("align", "Alignment", [
  { label: "Start", value: "start" },
  { label: "Center", value: "center" },
]);

// @ts-expect-error invalid key from the real hero schema
hero.text("heading", "Heading");

// @ts-expect-error wrong helper for string field
hero.checkbox("headline", "Headline");

// @ts-expect-error nested CTA data is not a string field
hero.text("primaryCta", "Primary CTA");

// @ts-expect-error select option is not allowed by the real enum schema
hero.select("align", "Alignment", [{ label: "End", value: "end" }]);

prose.stringList("paragraphs", "Paragraphs");

// @ts-expect-error gallery images are image objects, not strings
gallery.stringList("images", "Images");

export const beforeAfterEditor = beforeAfter.object({
  type: "before-after",
  title: "Before After",
  defaults: {
    type: "before-after",
    title: "Before and after",
    before: { ...imageDefaults, label: "Before" },
    after: { ...imageDefaults, label: "After" },
  } satisfies z.infer<typeof BeforeAfterSchema>,
  fields: [
    beforeAfter.section("Main", [
      beforeAfter.readonly("type"),
      beforeAfter.text("title", "Title"),
      beforeAfter.textarea("lead", "Lead"),
    ]),
  ],
});

export const contactEditor = contact.object({
  type: "contact",
  title: "Contact",
  defaults: {
    type: "contact",
    address: "123 Main Street",
  } satisfies z.infer<typeof ContactSchema>,
  fields: [
    contact.section("Contact", [
      contact.readonly("type"),
      contact.text("title", "Title"),
      contact.textarea("address", "Address"),
      contact.text("email", "Email"),
    ]),
  ],
});

export const contactFormEditor = contactForm.object({
  type: "contact-form",
  title: "Contact Form",
  defaults: {
    type: "contact-form",
    mode: "demo",
    title: "Contact us",
    action: "/contact",
    submitLabel: "Send",
  } satisfies z.infer<typeof ContactFormSchema>,
  fields: [
    contactForm.section("Form", [
      contactForm.readonly("type"),
      contactForm.select("mode", "Mode", [
        { label: "Demo", value: "demo" },
        { label: "Production", value: "production" },
      ]),
      contactForm.text("title", "Title"),
      contactForm.text("action", "Action"),
      contactForm.text("submitLabel", "Submit label"),
    ]),
  ],
});

export const ctaBandEditor = ctaBand.object({
  type: "cta-band",
  title: "CTA Band",
  defaults: {
    type: "cta-band",
    headline: "Ready to start?",
    primaryCta: linkDefaults,
  } satisfies z.infer<typeof CtaBandSchema>,
  fields: [
    ctaBand.section("Main", [
      ctaBand.readonly("type"),
      ctaBand.text("headline", "Headline"),
      ctaBand.textarea("body", "Body"),
    ]),
  ],
});

export const faqEditor = faq.object({
  type: "faq",
  title: "FAQ",
  defaults: {
    type: "faq",
    title: "Questions",
    items: [{ question: "What do you offer?", answer: "Helpful services." }],
  } satisfies z.infer<typeof FaqSchema>,
  fields: [
    faq.section("Main", [faq.readonly("type"), faq.text("title", "Title")]),
  ],
});

export const featureGridEditor = featureGrid.object({
  type: "feature-grid",
  title: "Feature Grid",
  defaults: {
    type: "feature-grid",
    title: "Features",
    columns: "3",
    items: [{ title: "Feature", body: "Useful detail." }],
  } satisfies z.infer<typeof FeatureGridSchema>,
  fields: [
    featureGrid.section("Main", [
      featureGrid.readonly("type"),
      featureGrid.text("title", "Title"),
      featureGrid.textarea("lead", "Lead"),
      featureGrid.select("columns", "Columns", [
        { label: "Two", value: "2" },
        { label: "Three", value: "3" },
        { label: "Four", value: "4" },
      ]),
    ]),
  ],
});

export const galleryEditor = gallery.object({
  type: "gallery",
  title: "Gallery",
  defaults: {
    type: "gallery",
    title: "Gallery",
    columns: "3",
    images: [imageDefaults, { ...imageDefaults, src: "/content/example-2.jpg" }],
  } satisfies z.infer<typeof GallerySchema>,
  fields: [
    gallery.section("Main", [
      gallery.readonly("type"),
      gallery.text("title", "Title"),
      gallery.textarea("lead", "Lead"),
      gallery.select("columns", "Columns", [
        { label: "Two", value: "2" },
        { label: "Three", value: "3" },
        { label: "Four", value: "4" },
      ]),
    ]),
  ],
});

export const googleMapsEditor = googleMaps.object({
  type: "google-maps",
  title: "Google Maps",
  defaults: {
    type: "google-maps",
    embedUrl: mapsEmbedUrl,
    title: "Map",
    size: "wide",
  } satisfies z.infer<typeof GoogleMapsSchema>,
  fields: [
    googleMaps.section("Main", [
      googleMaps.readonly("type"),
      googleMaps.text("title", "Title"),
      googleMaps.textarea("caption", "Caption"),
      googleMaps.select("size", "Size", [
        { label: "Content", value: "content" },
        { label: "Wide", value: "wide" },
      ]),
    ]),
  ],
});

export const heroEditor = hero.object({
  type: "hero",
  title: "Hero",
  defaults: {
    type: "hero",
    headline: "Launch faster",
    primaryCta: linkDefaults,
    align: "start",
  } satisfies z.infer<typeof HeroSchemaBase>,
  fields: [
    hero.section("Main", [
      hero.readonly("type"),
      hero.text("headline", "Headline"),
      hero.textarea("subheadline", "Subheadline"),
      hero.select("align", "Alignment", [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
      ]),
    ]),
  ],
});

export const hoursEditor = hours.object({
  type: "hours",
  title: "Hours",
  defaults: {
    type: "hours",
    entries: [hoursEntryDefaults],
  } satisfies z.infer<typeof HoursSchema>,
  fields: [
    hours.section("Main", [hours.readonly("type"), hours.text("title", "Title")]),
  ],
});

export const imageTextEditor = imageText.object({
  type: "image-text",
  title: "Image Text",
  defaults: {
    type: "image-text",
    title: "About us",
    paragraphs: ["Useful details."],
    image: imageDefaults,
    imagePosition: "end",
  } satisfies z.infer<typeof ImageTextSchema>,
  fields: [
    imageText.section("Main", [
      imageText.readonly("type"),
      imageText.text("eyebrow", "Eyebrow"),
      imageText.text("title", "Title"),
      imageText.stringList("paragraphs", "Paragraphs"),
      imageText.select("imagePosition", "Image position", [
        { label: "Start", value: "start" },
        { label: "End", value: "end" },
      ]),
    ]),
  ],
});

export const logoStripEditor = logoStrip.object({
  type: "logo-strip",
  title: "Logo Strip",
  defaults: {
    type: "logo-strip",
    title: "Partners",
    logos: [
      { src: "/content/logo-1.svg", alt: "First logo" },
      { src: "/content/logo-2.svg", alt: "Second logo" },
    ],
  } satisfies z.infer<typeof LogoStripSchema>,
  fields: [
    logoStrip.section("Main", [
      logoStrip.readonly("type"),
      logoStrip.text("title", "Title"),
      logoStrip.textarea("lead", "Lead"),
    ]),
  ],
});

export const mediaEditor = media.object({
  type: "media",
  title: "Media",
  defaults: {
    type: "media",
    src: "/content/example.jpg",
    alt: "Example image",
    size: "wide",
  } satisfies z.infer<typeof MediaSchemaBase>,
  fields: [
    media.section("Main", [
      media.readonly("type"),
      media.text("src", "Source"),
      media.text("alt", "Alt text"),
      media.textarea("caption", "Caption"),
      media.select("loading", "Loading", [
        { label: "Eager", value: "eager" },
        { label: "Lazy", value: "lazy" },
      ]),
      media.number("width", "Width"),
      media.number("height", "Height"),
      media.select("size", "Size", [
        { label: "Content", value: "content" },
        { label: "Wide", value: "wide" },
      ]),
    ]),
  ],
});

export const navigationBarEditor = navigationBar.object({
  type: "navigation-bar",
  title: "Navigation Bar",
  defaults: {
    type: "navigation-bar",
    brandText: "Example",
    links: [linkDefaults],
  } satisfies z.infer<typeof NavigationBarSchemaBase>,
  fields: [
    navigationBar.section("Main", [
      navigationBar.readonly("type"),
      navigationBar.text("brandText", "Brand text"),
    ]),
  ],
});

export const proseEditor = prose.object({
  type: "prose",
  title: "Prose",
  defaults: {
    type: "prose",
    paragraphs: ["Useful details."],
  } satisfies z.infer<typeof ProseSchema>,
  fields: [
    prose.section("Content", [
      prose.readonly("type"),
      prose.text("title", "Title"),
      prose.textarea("lead", "Lead"),
      prose.stringList("paragraphs", "Paragraphs"),
    ]),
  ],
});

export const storeLocationHoursEditor = storeLocationHours.object({
  type: "store-location-hours",
  title: "Store Location Hours",
  defaults: {
    type: "store-location-hours",
    embedUrl: mapsEmbedUrl,
    mapTitle: "Map",
    address: "123 Main Street",
    hours: [hoursEntryDefaults],
  } satisfies z.infer<typeof StoreLocationHoursSchema>,
  fields: [
    storeLocationHours.section("Main", [
      storeLocationHours.readonly("type"),
      storeLocationHours.text("title", "Title"),
      storeLocationHours.text("mapTitle", "Map title"),
      storeLocationHours.textarea("address", "Address"),
      storeLocationHours.text("email", "Email"),
    ]),
  ],
});

export const testimonialsEditor = testimonials.object({
  type: "testimonials",
  title: "Testimonials",
  defaults: {
    type: "testimonials",
    title: "Testimonials",
    items: [{ quote: "Excellent service.", name: "Customer" }],
  } satisfies z.infer<typeof TestimonialsSchema>,
  fields: [
    testimonials.section("Main", [
      testimonials.readonly("type"),
      testimonials.text("title", "Title"),
      testimonials.textarea("lead", "Lead"),
    ]),
  ],
});

const componentEditorRegistry = defineEditorRegistry(ComponentSchemaBase, {
  "before-after": beforeAfterEditor,
  contact: contactEditor,
  "contact-form": contactFormEditor,
  "cta-band": ctaBandEditor,
  faq: faqEditor,
  "feature-grid": featureGridEditor,
  gallery: galleryEditor,
  "google-maps": googleMapsEditor,
  hero: heroEditor,
  hours: hoursEditor,
  "image-text": imageTextEditor,
  "logo-strip": logoStripEditor,
  media: mediaEditor,
  "navigation-bar": navigationBarEditor,
  prose: proseEditor,
  "store-location-hours": storeLocationHoursEditor,
  testimonials: testimonialsEditor,
});

const { testimonials: _testimonialsEditor, ...registryMissingTestimonials } =
  componentEditorRegistry;

// @ts-expect-error missing testimonials editor
defineEditorRegistry(ComponentSchemaBase, registryMissingTestimonials);

defineEditorRegistry(ComponentSchemaBase, {
  ...componentEditorRegistry,
  // @ts-expect-error editor type does not match registry key
  hero: proseEditor,
});

defineEditorRegistry(ComponentSchemaBase, {
  ...componentEditorRegistry,
  // @ts-expect-error extra editor key is not part of the discriminated union
  heroo: heroEditor,
});
