import { BeforeAfterSchema } from "../components/before-after/before-after.schema.js";
import { ContactSchema } from "../components/contact/contact.schema.js";
import { ContactFormSchema } from "../components/contact-form/contact-form.schema.js";
import { CtaBandSchema } from "../components/cta-band/cta-band.schema.js";
import { FaqSchema } from "../components/faq/faq.schema.js";
import { FeatureGridSchema } from "../components/feature-grid/feature-grid.schema.js";
import { GallerySchema } from "../components/gallery/gallery.schema.js";
import { GoogleMapsSchema } from "../components/google-maps/google-maps.schema.js";
import { HeroSchemaBase } from "../components/hero/hero.schema.js";
import { HoursSchema, hoursDayNames } from "../components/hours/hours.schema.js";
import { ImageTextSchema } from "../components/image-text/image-text.schema.js";
import { LogoStripSchema } from "../components/logo-strip/logo-strip.schema.js";
import { MediaSchemaBase } from "../components/media/media.schema.js";
import { NavigationBarSchemaBase } from "../components/navigation-bar/navigation-bar.schema.js";
import { ProseSchema } from "../components/prose/prose.schema.js";
import { StoreLocationHoursSchema } from "../components/store-location-hours/store-location-hours.schema.js";
import { TestimonialsSchema } from "../components/testimonials/testimonials.schema.js";
import { ComponentSchemaBase } from "../components/index.js";
import { editorFor, defineEditorRegistry, type FieldDef } from "../editor-dsl/index.js";

const emptyImage = {
  src: "/content/example.jpg",
  alt: "Example image",
};

const emptyLink = {
  label: "Learn more",
  href: "/",
};

const emptyHoursEntry = {
  day: "Monday",
  open: "9 AM",
  close: "5 PM",
} as const;

const linkFields = [
  { kind: "text", key: "label", label: "Label" },
  { kind: "text", key: "href", label: "Href" },
  {
    kind: "select",
    key: "target",
    label: "Target",
    options: ["_self", "_blank"],
    optional: true,
  },
] as const satisfies readonly FieldDef<string>[];

const imageFields = [
  { kind: "text", key: "src", label: "Source" },
  { kind: "text", key: "alt", label: "Alt text" },
  { kind: "textarea", key: "caption", label: "Caption", optional: true },
  { kind: "number", key: "width", label: "Width", optional: true },
  { kind: "number", key: "height", label: "Height", optional: true },
] as const satisfies readonly FieldDef<string>[];

const hoursEntryFields = [
  {
    kind: "select",
    key: "day",
    label: "Day",
    options: hoursDayNames,
  },
  { kind: "text", key: "open", label: "Open" },
  { kind: "text", key: "close", label: "Close" },
] as const satisfies readonly FieldDef<string>[];

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

export const beforeAfterEditor = beforeAfter.object({
  type: "before-after",
  title: "Before After",
  defaults: {
    type: "before-after",
    title: "Before and after",
    before: { ...emptyImage, label: "Before" },
    after: { ...emptyImage, label: "After" },
  },
  fields: [
    beforeAfter.section("Main", [
      beforeAfter.readonly("type"),
      beforeAfter.text("title", "Title"),
      beforeAfter.textarea("lead", "Lead"),
      beforeAfter.objectField("before", "Before", [
        { kind: "text", key: "label", label: "Label" },
        ...imageFields,
      ]),
      beforeAfter.objectField("after", "After", [
        { kind: "text", key: "label", label: "Label" },
        ...imageFields,
      ]),
    ]),
  ],
});

export const contactEditor = contact.object({
  type: "contact",
  title: "Contact",
  defaults: {
    type: "contact",
    address: "123 Main Street",
  },
  fields: [
    contact.section("Contact", [
      contact.readonly("type"),
      contact.text("title", "Title"),
      contact.textarea("address", "Address"),
      contact.text("phone", "Phone"),
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
  },
  fields: [
    contactForm.section("Form", [
      contactForm.readonly("type"),
      contactForm.select("mode", "Mode", [
        { label: "Demo", value: "demo" },
        { label: "Production", value: "production" },
      ]),
      contactForm.text("title", "Title"),
      contactForm.textarea("intro", "Intro"),
      contactForm.text("action", "Action"),
      contactForm.text("submitLabel", "Submit label"),
      contactForm.text("subject", "Subject"),
      contactForm.textarea("deliveryNote", "Delivery note"),
    ]),
  ],
});

export const ctaBandEditor = ctaBand.object({
  type: "cta-band",
  title: "CTA Band",
  defaults: {
    type: "cta-band",
    headline: "Ready to start?",
    primaryCta: emptyLink,
  },
  fields: [
    ctaBand.section("Main", [
      ctaBand.readonly("type"),
      ctaBand.text("headline", "Headline"),
      ctaBand.textarea("body", "Body"),
      ctaBand.objectField("primaryCta", "Primary CTA", linkFields),
      ctaBand.optionalObject("secondaryCta", "Secondary CTA", emptyLink, linkFields),
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
  },
  fields: [
    faq.section("Main", [
      faq.readonly("type"),
      faq.text("title", "Title"),
      faq.objectList(
        "items",
        "Questions",
        { question: "Question", answer: "Answer" },
        [
          { kind: "text", key: "question", label: "Question" },
          { kind: "textarea", key: "answer", label: "Answer" },
        ],
        { itemLabelKey: "question" },
      ),
    ]),
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
  },
  fields: [
    featureGrid.section("Main", [
      featureGrid.readonly("type"),
      featureGrid.text("title", "Title"),
      featureGrid.textarea("lead", "Lead"),
      featureGrid.select("columns", "Columns", [
        { label: "One", value: "1" },
        { label: "Two", value: "2" },
        { label: "Three", value: "3" },
        { label: "Four", value: "4" },
      ]),
      featureGrid.objectList(
        "items",
        "Items",
        { title: "Feature", body: "Useful detail." },
        [
          { kind: "text", key: "title", label: "Title" },
          { kind: "textarea", key: "body", label: "Body", optional: true },
          {
            kind: "optional-object",
            key: "image",
            label: "Image",
            createValue: emptyImage,
            fields: imageFields,
          },
          {
            kind: "select",
            key: "imageLayout",
            label: "Image layout",
            options: ["inline", "stacked"],
            optional: true,
          },
          {
            kind: "optional-object",
            key: "cta",
            label: "CTA",
            createValue: emptyLink,
            fields: linkFields,
          },
          { kind: "checkbox", key: "selected", label: "Selected", optional: true },
        ],
        { itemLabelKey: "title" },
      ),
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
    images: [emptyImage, { ...emptyImage, src: "/content/example-2.jpg" }],
  },
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
      gallery.objectList("images", "Images", emptyImage, imageFields, { itemLabelKey: "alt" }),
    ]),
  ],
});

export const googleMapsEditor = googleMaps.object({
  type: "google-maps",
  title: "Google Maps",
  defaults: {
    type: "google-maps",
    embedUrl: "https://www.google.com/maps/embed?pb=example",
    title: "Map",
    size: "wide",
  },
  fields: [
    googleMaps.section("Main", [
      googleMaps.readonly("type"),
      googleMaps.text("embedUrl", "Embed URL"),
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
    primaryCta: emptyLink,
    align: "start",
  },
  fields: [
    hero.section("Main", [
      hero.readonly("type"),
      hero.text("headline", "Headline"),
      hero.textarea("subheadline", "Subheadline"),
      hero.select("align", "Alignment", [
        { label: "Start", value: "start" },
        { label: "Center", value: "center" },
      ]),
      hero.optionalObject("primaryCta", "Primary CTA", emptyLink, linkFields),
      hero.optionalObject("secondaryCta", "Secondary CTA", emptyLink, linkFields),
    ]),
  ],
});

export const hoursEditor = hours.object({
  type: "hours",
  title: "Hours",
  defaults: {
    type: "hours",
    entries: [emptyHoursEntry],
  },
  fields: [
    hours.section("Main", [
      hours.readonly("type"),
      hours.text("title", "Title"),
      hours.objectList("entries", "Entries", emptyHoursEntry, hoursEntryFields, {
        itemLabelKey: "day",
      }),
    ]),
  ],
});

export const imageTextEditor = imageText.object({
  type: "image-text",
  title: "Image Text",
  defaults: {
    type: "image-text",
    title: "About us",
    paragraphs: ["Useful details."],
    image: emptyImage,
    imagePosition: "end",
  },
  fields: [
    imageText.section("Main", [
      imageText.readonly("type"),
      imageText.text("eyebrow", "Eyebrow"),
      imageText.text("title", "Title"),
      imageText.stringList("paragraphs", "Paragraphs", "Useful details."),
      imageText.objectField("image", "Image", imageFields),
      imageText.select("imagePosition", "Image position", [
        { label: "Start", value: "start" },
        { label: "End", value: "end" },
      ]),
      imageText.optionalObject("primaryCta", "Primary CTA", emptyLink, linkFields),
      imageText.optionalObject("secondaryCta", "Secondary CTA", emptyLink, linkFields),
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
  },
  fields: [
    logoStrip.section("Main", [
      logoStrip.readonly("type"),
      logoStrip.text("title", "Title"),
      logoStrip.textarea("lead", "Lead"),
      logoStrip.objectList(
        "logos",
        "Logos",
        { src: "/content/logo.svg", alt: "Logo" },
        [
          { kind: "text", key: "src", label: "Source" },
          { kind: "text", key: "alt", label: "Alt text" },
          { kind: "text", key: "href", label: "Href", optional: true },
          { kind: "number", key: "width", label: "Width", optional: true },
          { kind: "number", key: "height", label: "Height", optional: true },
        ],
        { itemLabelKey: "alt" },
      ),
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
  },
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
    links: [emptyLink],
  },
  fields: [
    navigationBar.section("Main", [
      navigationBar.readonly("type"),
      navigationBar.text("brandText", "Brand text"),
      navigationBar.optionalObject("brandImage", "Brand image", emptyImage, [
        { kind: "text", key: "src", label: "Source" },
        { kind: "text", key: "alt", label: "Alt text" },
      ]),
      navigationBar.objectList("links", "Links", emptyLink, linkFields, {
        itemLabelKey: "label",
      }),
    ]),
  ],
});

export const proseEditor = prose.object({
  type: "prose",
  title: "Prose",
  defaults: {
    type: "prose",
    paragraphs: ["Useful details."],
  },
  fields: [
    prose.section("Content", [
      prose.readonly("type"),
      prose.text("title", "Title"),
      prose.textarea("lead", "Lead"),
      prose.stringList("paragraphs", "Paragraphs", "Useful details."),
    ]),
  ],
});

export const storeLocationHoursEditor = storeLocationHours.object({
  type: "store-location-hours",
  title: "Store Location Hours",
  defaults: {
    type: "store-location-hours",
    embedUrl: "https://www.google.com/maps/embed?pb=example",
    mapTitle: "Map",
    address: "123 Main Street",
    hours: [emptyHoursEntry],
  },
  fields: [
    storeLocationHours.section("Main", [
      storeLocationHours.readonly("type"),
      storeLocationHours.text("title", "Title"),
      storeLocationHours.text("embedUrl", "Embed URL"),
      storeLocationHours.text("mapTitle", "Map title"),
      storeLocationHours.textarea("address", "Address"),
      storeLocationHours.text("phone", "Phone"),
      storeLocationHours.text("email", "Email"),
      storeLocationHours.objectList("hours", "Hours", emptyHoursEntry, hoursEntryFields, {
        itemLabelKey: "day",
      }),
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
  },
  fields: [
    testimonials.section("Main", [
      testimonials.readonly("type"),
      testimonials.text("title", "Title"),
      testimonials.textarea("lead", "Lead"),
      testimonials.objectList(
        "items",
        "Testimonials",
        { quote: "Excellent service.", name: "Customer" },
        [
          { kind: "textarea", key: "quote", label: "Quote" },
          { kind: "text", key: "name", label: "Name" },
          { kind: "text", key: "role", label: "Role", optional: true },
          { kind: "text", key: "company", label: "Company", optional: true },
          {
            kind: "optional-object",
            key: "image",
            label: "Image",
            createValue: emptyImage,
            fields: imageFields,
          },
        ],
        { itemLabelKey: "name" },
      ),
    ]),
  ],
});

export const componentEditorRegistry = defineEditorRegistry(ComponentSchemaBase, {
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
