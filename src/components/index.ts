import { fileURLToPath } from "node:url";
import { z } from "zod";

import { BeforeAfterSchema } from "./before-after/before-after.schema.js";
import {
  beforeAfterClassNames,
  renderBeforeAfter,
} from "./before-after/before-after.render.js";
import {
  ContactFormSchema,
} from "./contact-form/contact-form.schema.js";
import {
  contactFormClassNames,
  renderContactForm,
} from "./contact-form/contact-form.render.js";
import { CtaBandSchema } from "./cta-band/cta-band.schema.js";
import { ctaBandClassNames, renderCtaBand } from "./cta-band/cta-band.render.js";
import { FaqSchema } from "./faq/faq.schema.js";
import { faqClassNames, renderFaq } from "./faq/faq.render.js";
import { FeatureListSchema } from "./feature-list/feature-list.schema.js";
import {
  featureListClassNames,
  renderFeatureList,
} from "./feature-list/feature-list.render.js";
import {
  FeatureGridSchema,
} from "./feature-grid/feature-grid.schema.js";
import {
  featureGridClassNames,
  renderFeatureGrid,
} from "./feature-grid/feature-grid.render.js";
import { GallerySchema } from "./gallery/gallery.schema.js";
import { galleryClassNames, renderGallery } from "./gallery/gallery.render.js";
import { GoogleMapsSchema } from "./google-maps/google-maps.schema.js";
import {
  googleMapsClassNames,
  renderGoogleMaps,
} from "./google-maps/google-maps.render.js";
import { HeroSchema, HeroSchemaBase } from "./hero/hero.schema.js";
import { heroClassNames, renderHero } from "./hero/hero.render.js";
import { ImageTextSchema } from "./image-text/image-text.schema.js";
import {
  imageTextClassNames,
  renderImageText,
} from "./image-text/image-text.render.js";
import { LinkListSchema } from "./link-list/link-list.schema.js";
import { linkListClassNames, renderLinkList } from "./link-list/link-list.render.js";
import { LogoStripSchema } from "./logo-strip/logo-strip.schema.js";
import {
  logoStripClassNames,
  renderLogoStrip,
} from "./logo-strip/logo-strip.render.js";
import { MediaSchema } from "./media/media.schema.js";
import { mediaClassNames, renderMedia } from "./media/media.render.js";
import {
  NavigationBarSchemaBase,
} from "./navigation-bar/navigation-bar.schema.js";
import {
  navigationBarRuntimeScript,
} from "./navigation-bar/navigation-bar.runtime.js";
import {
  navigationBarClassNames,
  renderNavigationBar,
} from "./navigation-bar/navigation-bar.render.js";
import {
  NavigationBarSchema,
} from "./navigation-bar/navigation-bar.schema.js";
import { ProseSchema } from "./prose/prose.schema.js";
import { proseClassNames, renderProse } from "./prose/prose.render.js";
import { TestimonialsSchema } from "./testimonials/testimonials.schema.js";
import {
  renderTestimonials,
  testimonialsClassNames,
} from "./testimonials/testimonials.render.js";

export const ComponentSchemaBase = z.discriminatedUnion("type", [
  BeforeAfterSchema,
  HeroSchemaBase,
  FeatureListSchema,
  FeatureGridSchema,
  FaqSchema,
  GallerySchema,
  CtaBandSchema,
  ContactFormSchema,
  GoogleMapsSchema,
  ImageTextSchema,
  LinkListSchema,
  LogoStripSchema,
  MediaSchema,
  NavigationBarSchemaBase,
  ProseSchema,
  TestimonialsSchema,
]);

export const ComponentSchema = ComponentSchemaBase.superRefine((value, ctx) => {
  if (value.type !== "hero") {
    return;
  }

  const parsedHero = HeroSchema.safeParse(value);
  if (parsedHero.success) {
    return;
  }

  for (const issue of parsedHero.error.issues) {
    ctx.addIssue(issue);
  }
});

export type ComponentData = z.infer<typeof ComponentSchemaBase>;
export type ComponentType = ComponentData["type"];

export interface ComponentDefinition {
  type: ComponentType;
  render: (data: ComponentData) => string;
  cssPath: string;
  classNames: readonly string[];
  scriptContent?: string;
}

export const sharedClassNames = [
  "c-button",
  "c-button--primary",
  "c-button--secondary",
] as const;

export const componentDefinitions: readonly ComponentDefinition[] = [
  {
    type: "before-after",
    render: (data) => renderBeforeAfter(BeforeAfterSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./before-after/before-after.css", import.meta.url)),
    classNames: beforeAfterClassNames,
  },
  {
    type: "hero",
    render: (data) => renderHero(HeroSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./hero/hero.css", import.meta.url)),
    classNames: heroClassNames,
  },
  {
    type: "feature-list",
    render: (data) => renderFeatureList(FeatureListSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./feature-list/feature-list.css", import.meta.url)),
    classNames: featureListClassNames,
  },
  {
    type: "feature-grid",
    render: (data) => renderFeatureGrid(FeatureGridSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./feature-grid/feature-grid.css", import.meta.url)),
    classNames: featureGridClassNames,
  },
  {
    type: "gallery",
    render: (data) => renderGallery(GallerySchema.parse(data)),
    cssPath: fileURLToPath(new URL("./gallery/gallery.css", import.meta.url)),
    classNames: galleryClassNames,
  },
  {
    type: "faq",
    render: (data) => renderFaq(FaqSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./faq/faq.css", import.meta.url)),
    classNames: faqClassNames,
  },
  {
    type: "cta-band",
    render: (data) => renderCtaBand(CtaBandSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./cta-band/cta-band.css", import.meta.url)),
    classNames: ctaBandClassNames,
  },
  {
    type: "contact-form",
    render: (data) => renderContactForm(ContactFormSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./contact-form/contact-form.css", import.meta.url)),
    classNames: contactFormClassNames,
  },
  {
    type: "google-maps",
    render: (data) => renderGoogleMaps(GoogleMapsSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./google-maps/google-maps.css", import.meta.url)),
    classNames: googleMapsClassNames,
  },
  {
    type: "image-text",
    render: (data) => renderImageText(ImageTextSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./image-text/image-text.css", import.meta.url)),
    classNames: imageTextClassNames,
  },
  {
    type: "link-list",
    render: (data) => renderLinkList(LinkListSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./link-list/link-list.css", import.meta.url)),
    classNames: linkListClassNames,
  },
  {
    type: "logo-strip",
    render: (data) => renderLogoStrip(LogoStripSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./logo-strip/logo-strip.css", import.meta.url)),
    classNames: logoStripClassNames,
  },
  {
    type: "media",
    render: (data) => renderMedia(MediaSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./media/media.css", import.meta.url)),
    classNames: mediaClassNames,
  },
  {
    type: "navigation-bar",
    render: (data) => renderNavigationBar(NavigationBarSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./navigation-bar/navigation-bar.css", import.meta.url)),
    classNames: navigationBarClassNames,
    scriptContent: navigationBarRuntimeScript,
  },
  {
    type: "prose",
    render: (data) => renderProse(ProseSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./prose/prose.css", import.meta.url)),
    classNames: proseClassNames,
  },
  {
    type: "testimonials",
    render: (data) => renderTestimonials(TestimonialsSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./testimonials/testimonials.css", import.meta.url)),
    classNames: testimonialsClassNames,
  },
];

export const componentTypeNames = componentDefinitions.map(
  (componentDefinition) => componentDefinition.type,
);

export const renderComponent = (data: ComponentData): string => {
  switch (data.type) {
    case "before-after":
      return renderBeforeAfter(data);
    case "hero":
      return renderHero(data);
    case "feature-list":
      return renderFeatureList(data);
    case "feature-grid":
      return renderFeatureGrid(data);
    case "gallery":
      return renderGallery(data);
    case "faq":
      return renderFaq(data);
    case "cta-band":
      return renderCtaBand(data);
    case "contact-form":
      return renderContactForm(data);
    case "google-maps":
      return renderGoogleMaps(data);
    case "image-text":
      return renderImageText(data);
    case "link-list":
      return renderLinkList(data);
    case "logo-strip":
      return renderLogoStrip(data);
    case "media":
      return renderMedia(data);
    case "navigation-bar":
      return renderNavigationBar(data);
    case "prose":
      return renderProse(data);
    case "testimonials":
      return renderTestimonials(data);
    default: {
      throw new Error(`No renderer exists for component '${JSON.stringify(data)}'`);
    }
  }
};
