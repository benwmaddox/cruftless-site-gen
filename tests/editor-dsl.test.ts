import { describe, expect, it } from "vitest";

import { ComponentSchemaBase, componentTypeNames } from "../src/components/index.js";
import { BeforeAfterSchema } from "../src/components/before-after/before-after.schema.js";
import { ContactSchema } from "../src/components/contact/contact.schema.js";
import { ContactFormSchema } from "../src/components/contact-form/contact-form.schema.js";
import { CtaBandSchema } from "../src/components/cta-band/cta-band.schema.js";
import { FaqSchema } from "../src/components/faq/faq.schema.js";
import { FeatureGridSchema } from "../src/components/feature-grid/feature-grid.schema.js";
import { GallerySchema } from "../src/components/gallery/gallery.schema.js";
import { GoogleMapsSchema } from "../src/components/google-maps/google-maps.schema.js";
import { HeroSchemaBase } from "../src/components/hero/hero.schema.js";
import { HoursSchema } from "../src/components/hours/hours.schema.js";
import { ImageTextSchema } from "../src/components/image-text/image-text.schema.js";
import { LogoStripSchema } from "../src/components/logo-strip/logo-strip.schema.js";
import { MediaSchemaBase } from "../src/components/media/media.schema.js";
import { NavigationBarSchemaBase } from "../src/components/navigation-bar/navigation-bar.schema.js";
import { ProseSchema } from "../src/components/prose/prose.schema.js";
import { StoreLocationHoursSchema } from "../src/components/store-location-hours/store-location-hours.schema.js";
import { TestimonialsSchema } from "../src/components/testimonials/testimonials.schema.js";
import { SiteSchema } from "../src/schemas/site.schema.js";
import { defineEditorRegistry, editorFor } from "../src/editor-dsl/index.js";

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

const buildComponentEditorRegistry = () => {
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

  const beforeAfterEditor = beforeAfter.object({
    type: "before-after",
    title: "Before After",
    defaults: {
      type: "before-after",
      title: "Before and after",
      before: { ...imageDefaults, label: "Before" },
      after: { ...imageDefaults, label: "After" },
    },
    fields: [beforeAfter.section("Main", [beforeAfter.readonly("type")])],
  });
  const contactEditor = contact.object({
    type: "contact",
    title: "Contact",
    defaults: { type: "contact", address: "123 Main Street" },
    fields: [contact.section("Contact", [contact.textarea("address", "Address")])],
  });
  const contactFormEditor = contactForm.object({
    type: "contact-form",
    title: "Contact Form",
    defaults: {
      type: "contact-form",
      mode: "demo",
      title: "Contact us",
      action: "/contact",
      submitLabel: "Send",
    },
    fields: [contactForm.section("Form", [contactForm.select("mode", "Mode")])],
  });
  const ctaBandEditor = ctaBand.object({
    type: "cta-band",
    title: "CTA Band",
    defaults: {
      type: "cta-band",
      headline: "Ready to start?",
      primaryCta: linkDefaults,
    },
    fields: [ctaBand.section("Main", [ctaBand.text("headline", "Headline")])],
  });
  const faqEditor = faq.object({
    type: "faq",
    title: "FAQ",
    defaults: {
      type: "faq",
      title: "Questions",
      items: [{ question: "What do you offer?", answer: "Helpful services." }],
    },
    fields: [faq.section("Main", [faq.text("title", "Title")])],
  });
  const featureGridEditor = featureGrid.object({
    type: "feature-grid",
    title: "Feature Grid",
    defaults: {
      type: "feature-grid",
      title: "Features",
      columns: "3",
      items: [{ title: "Feature", body: "Useful detail." }],
    },
    fields: [featureGrid.section("Main", [featureGrid.select("columns", "Columns")])],
  });
  const galleryEditor = gallery.object({
    type: "gallery",
    title: "Gallery",
    defaults: {
      type: "gallery",
      title: "Gallery",
      columns: "3",
      images: [imageDefaults, { ...imageDefaults, src: "/content/example-2.jpg" }],
    },
    fields: [gallery.section("Main", [gallery.select("columns", "Columns")])],
  });
  const googleMapsEditor = googleMaps.object({
    type: "google-maps",
    title: "Google Maps",
    defaults: {
      type: "google-maps",
      embedUrl: mapsEmbedUrl,
      title: "Map",
      size: "wide",
    },
    fields: [googleMaps.section("Main", [googleMaps.select("size", "Size")])],
  });
  const heroEditor = hero.object({
    type: "hero",
    title: "Hero",
    defaults: {
      type: "hero",
      headline: "Launch faster",
      primaryCta: linkDefaults,
      align: "start",
    },
    fields: [hero.section("Main", [hero.text("headline", "Headline")])],
  });
  const hoursEditor = hours.object({
    type: "hours",
    title: "Hours",
    defaults: { type: "hours", entries: [hoursEntryDefaults] },
    fields: [hours.section("Main", [hours.readonly("type")])],
  });
  const imageTextEditor = imageText.object({
    type: "image-text",
    title: "Image Text",
    defaults: {
      type: "image-text",
      title: "About us",
      paragraphs: ["Useful details."],
      image: imageDefaults,
      imagePosition: "end",
    },
    fields: [imageText.section("Main", [imageText.stringList("paragraphs", "Paragraphs")])],
  });
  const logoStripEditor = logoStrip.object({
    type: "logo-strip",
    title: "Logo Strip",
    defaults: {
      type: "logo-strip",
      title: "Partners",
      logos: [
        { src: "/content/logo-1.svg", alt: "First logo" },
        { src: "/content/logo-2.svg", alt: "Second logo" },
      ],
    },
    fields: [logoStrip.section("Main", [logoStrip.text("title", "Title")])],
  });
  const mediaEditor = media.object({
    type: "media",
    title: "Media",
    defaults: {
      type: "media",
      src: "/content/example.jpg",
      alt: "Example image",
      size: "wide",
    },
    fields: [media.section("Main", [media.text("src", "Source")])],
  });
  const navigationBarEditor = navigationBar.object({
    type: "navigation-bar",
    title: "Navigation Bar",
    defaults: {
      type: "navigation-bar",
      brandText: "Example",
      links: [linkDefaults],
    },
    fields: [navigationBar.section("Main", [navigationBar.text("brandText", "Brand text")])],
  });
  const proseEditor = prose.object({
    type: "prose",
    title: "Prose",
    defaults: { type: "prose", paragraphs: ["Useful details."] },
    fields: [prose.section("Content", [prose.stringList("paragraphs", "Paragraphs")])],
  });
  const storeLocationHoursEditor = storeLocationHours.object({
    type: "store-location-hours",
    title: "Store Location Hours",
    defaults: {
      type: "store-location-hours",
      embedUrl: mapsEmbedUrl,
      mapTitle: "Map",
      address: "123 Main Street",
      hours: [hoursEntryDefaults],
    },
    fields: [storeLocationHours.section("Main", [storeLocationHours.text("mapTitle", "Map title")])],
  });
  const testimonialsEditor = testimonials.object({
    type: "testimonials",
    title: "Testimonials",
    defaults: {
      type: "testimonials",
      title: "Testimonials",
      items: [{ quote: "Excellent service.", name: "Customer" }],
    },
    fields: [testimonials.section("Main", [testimonials.text("title", "Title")])],
  });

  return defineEditorRegistry(ComponentSchemaBase, {
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
};

describe("editorFor", () => {
  it("builds declarative editor data bound to the real site schemas", () => {
    const site = editorFor(SiteSchema, "theme");
    const hero = editorFor(HeroSchemaBase, "type");
    const heroDefaults = {
      type: "hero",
      headline: "Launch faster",
      primaryCta: linkDefaults,
      align: "start",
    } as const;

    const themeField = site.select("theme", "Theme", [
      { label: "Friendly Modern", value: "friendly-modern" },
    ]);
    const heroEditor = hero.object({
      type: "hero",
      title: "Hero",
      defaults: heroDefaults,
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

    expect(themeField).toEqual({
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [{ label: "Friendly Modern", value: "friendly-modern" }],
    });
    expect(heroEditor).toEqual({
      kind: "object-editor",
      schema: HeroSchemaBase,
      type: "hero",
      title: "Hero",
      defaults: heroDefaults,
      fields: [
        {
          kind: "section",
          title: "Main",
          fields: [
            { kind: "readonly", key: "type" },
            { kind: "text", key: "headline", label: "Headline" },
            { kind: "textarea", key: "subheadline", label: "Subheadline", optional: true },
            {
              kind: "select",
              key: "align",
              label: "Alignment",
              optional: true,
              options: [
                { label: "Start", value: "start" },
                { label: "Center", value: "center" },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe("defineEditorRegistry", () => {
  it("returns a registry covering the real component schema union", () => {
    const registry = buildComponentEditorRegistry();

    expect(Object.keys(registry).sort()).toEqual([...componentTypeNames].sort());
    expect(registry.hero.schema).toBe(HeroSchemaBase);
    expect(registry.prose.schema).toBe(ProseSchema);
    expect(registry.gallery.schema).toBe(GallerySchema);
  });
});
