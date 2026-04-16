import { fileURLToPath } from "node:url";
import { z } from "zod";

import { BeforeAfterSchema } from "./before-after/before-after.schema.js";
import {
  beforeAfterClassNames,
  renderBeforeAfter,
} from "./before-after/before-after.render.js";
import {
  ContactSchema,
} from "./contact/contact.schema.js";
import {
  contactClassNames,
  renderContact,
} from "./contact/contact.render.js";
import {
  ContactFormSchema,
} from "./contact-form/contact-form.schema.js";
import {
  contactFormClassNames,
  renderContactForm,
} from "./contact-form/contact-form.render.js";
import { contactFormRuntimeScript } from "./contact-form/contact-form.runtime.js";
import { CtaBandSchema } from "./cta-band/cta-band.schema.js";
import { ctaBandClassNames, renderCtaBand } from "./cta-band/cta-band.render.js";
import { FaqSchema } from "./faq/faq.schema.js";
import { faqClassNames, renderFaq } from "./faq/faq.render.js";
import {
  FeatureGridSchema,
} from "./feature-grid/feature-grid.schema.js";
import {
  featureGridClassNames,
  renderFeatureGrid,
} from "./feature-grid/feature-grid.render.js";
import { galleryRuntimeScript } from "./gallery/gallery.runtime.js";
import { GallerySchema } from "./gallery/gallery.schema.js";
import { galleryClassNames, renderGallery } from "./gallery/gallery.render.js";
import { GoogleMapsSchema } from "./google-maps/google-maps.schema.js";
import {
  googleMapsClassNames,
  renderGoogleMaps,
} from "./google-maps/google-maps.render.js";
import { HeroSchema, HeroSchemaBase } from "./hero/hero.schema.js";
import { heroClassNames, renderHero } from "./hero/hero.render.js";
import { HoursSchema } from "./hours/hours.schema.js";
import { hoursClassNames, renderHours } from "./hours/hours.render.js";
import { ImageTextSchema } from "./image-text/image-text.schema.js";
import {
  imageTextClassNames,
  renderImageText,
} from "./image-text/image-text.render.js";
import { LogoStripSchema } from "./logo-strip/logo-strip.schema.js";
import {
  logoStripClassNames,
  renderLogoStrip,
} from "./logo-strip/logo-strip.render.js";
import { MediaSchema, MediaSchemaBase } from "./media/media.schema.js";
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
import {
  defaultComponentRenderContext,
  type ComponentRenderContext,
} from "./render-context.js";
import { StoreLocationHoursSchema } from "./store-location-hours/store-location-hours.schema.js";
import {
  renderStoreLocationHours,
  storeLocationHoursClassNames,
} from "./store-location-hours/store-location-hours.render.js";
import { TestimonialsSchema } from "./testimonials/testimonials.schema.js";
import {
  renderTestimonials,
  testimonialsClassNames,
} from "./testimonials/testimonials.render.js";

export const ComponentSchemaBase = z.discriminatedUnion("type", [
  BeforeAfterSchema,
  ContactSchema,
  ContactFormSchema,
  CtaBandSchema,
  FaqSchema,
  FeatureGridSchema,
  GallerySchema,
  GoogleMapsSchema,
  HeroSchemaBase,
  HoursSchema,
  ImageTextSchema,
  MediaSchemaBase,
  LogoStripSchema,
  NavigationBarSchemaBase,
  ProseSchema,
  StoreLocationHoursSchema,
  TestimonialsSchema,
]);

export const ComponentSchema = ComponentSchemaBase.superRefine((value, ctx) => {
  if (value.type === "hero") {
    if (!value.primaryCta && !value.secondaryCta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one CTA is required",
      });
    }

    return;
  }

  if (value.type !== "media") {
    return;
  }

  if (value.src.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["src"],
      message: "src is required",
    });
    return;
  }

  if (!value.alt || value.alt.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["alt"],
      message: "alt is required when src is provided",
    });
  }
});

export type ComponentData = z.infer<typeof ComponentSchemaBase>;
export type ComponentType = ComponentData["type"];

export interface ComponentDefinition {
  type: ComponentType;
  render: (data: ComponentData, renderContext?: ComponentRenderContext) => string;
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
    render: (data, renderContext) =>
      renderBeforeAfter(BeforeAfterSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./before-after/before-after.css", import.meta.url)),
    classNames: beforeAfterClassNames,
  },
  {
    type: "contact",
    render: (data) => renderContact(ContactSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./contact/contact.css", import.meta.url)),
    classNames: contactClassNames,
  },
  {
    type: "contact-form",
    render: (data) => renderContactForm(ContactFormSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./contact-form/contact-form.css", import.meta.url)),
    classNames: contactFormClassNames,
    scriptContent: contactFormRuntimeScript,
  },
  {
    type: "cta-band",
    render: (data) => renderCtaBand(CtaBandSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./cta-band/cta-band.css", import.meta.url)),
    classNames: ctaBandClassNames,
  },
  {
    type: "faq",
    render: (data) => renderFaq(FaqSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./faq/faq.css", import.meta.url)),
    classNames: faqClassNames,
  },
  {
    type: "feature-grid",
    render: (data, renderContext) =>
      renderFeatureGrid(FeatureGridSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./feature-grid/feature-grid.css", import.meta.url)),
    classNames: featureGridClassNames,
  },
  {
    type: "gallery",
    render: (data, renderContext) => renderGallery(GallerySchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./gallery/gallery.css", import.meta.url)),
    classNames: galleryClassNames,
    scriptContent: galleryRuntimeScript,
  },
  {
    type: "google-maps",
    render: (data) => renderGoogleMaps(GoogleMapsSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./google-maps/google-maps.css", import.meta.url)),
    classNames: googleMapsClassNames,
  },
  {
    type: "hero",
    render: (data) => renderHero(HeroSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./hero/hero.css", import.meta.url)),
    classNames: heroClassNames,
  },
  {
    type: "hours",
    render: (data) => renderHours(HoursSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./hours/hours.css", import.meta.url)),
    classNames: hoursClassNames,
  },
  {
    type: "image-text",
    render: (data, renderContext) => renderImageText(ImageTextSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./image-text/image-text.css", import.meta.url)),
    classNames: imageTextClassNames,
  },
  {
    type: "logo-strip",
    render: (data, renderContext) => renderLogoStrip(LogoStripSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./logo-strip/logo-strip.css", import.meta.url)),
    classNames: logoStripClassNames,
  },
  {
    type: "media",
    render: (data, renderContext) => renderMedia(MediaSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./media/media.css", import.meta.url)),
    classNames: mediaClassNames,
  },
  {
    type: "navigation-bar",
    render: (data, renderContext) =>
      renderNavigationBar(NavigationBarSchema.parse(data), renderContext),
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
    type: "store-location-hours",
    render: (data) => renderStoreLocationHours(StoreLocationHoursSchema.parse(data)),
    cssPath: fileURLToPath(
      new URL("./store-location-hours/store-location-hours.css", import.meta.url),
    ),
    classNames: storeLocationHoursClassNames,
  },
  {
    type: "testimonials",
    render: (data, renderContext) =>
      renderTestimonials(TestimonialsSchema.parse(data), renderContext),
    cssPath: fileURLToPath(new URL("./testimonials/testimonials.css", import.meta.url)),
    classNames: testimonialsClassNames,
  },
];

export const componentTypeNames = componentDefinitions.map(
  (componentDefinition) => componentDefinition.type,
);

export const renderComponent = (
  data: ComponentData,
  renderContext: ComponentRenderContext = defaultComponentRenderContext,
): string => {
  switch (data.type) {
    case "before-after":
      return renderBeforeAfter(data, renderContext);
    case "contact":
      return renderContact(data);
    case "contact-form":
      return renderContactForm(data);
    case "cta-band":
      return renderCtaBand(data);
    case "faq":
      return renderFaq(data);
    case "feature-grid":
      return renderFeatureGrid(data, renderContext);
    case "gallery":
      return renderGallery(data, renderContext);
    case "google-maps":
      return renderGoogleMaps(data);
    case "hero":
      return renderHero(data);
    case "hours":
      return renderHours(data);
    case "image-text":
      return renderImageText(data, renderContext);
    case "logo-strip":
      return renderLogoStrip(data, renderContext);
    case "media":
      return renderMedia(data, renderContext);
    case "navigation-bar":
      return renderNavigationBar(data, renderContext);
    case "prose":
      return renderProse(data);
    case "store-location-hours":
      return renderStoreLocationHours(data);
    case "testimonials":
      return renderTestimonials(data, renderContext);
    default: {
      throw new Error(`No renderer exists for component '${JSON.stringify(data)}'`);
    }
  }
};
