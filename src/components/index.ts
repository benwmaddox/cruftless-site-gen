import { fileURLToPath } from "node:url";
import { z } from "zod";

import { CtaBandSchema } from "./cta-band/cta-band.schema.js";
import { ctaBandClassNames, renderCtaBand } from "./cta-band/cta-band.render.js";
import {
  FeatureGridSchema,
} from "./feature-grid/feature-grid.schema.js";
import {
  featureGridClassNames,
  renderFeatureGrid,
} from "./feature-grid/feature-grid.render.js";
import { HeroSchema, HeroSchemaBase } from "./hero/hero.schema.js";
import { heroClassNames, renderHero } from "./hero/hero.render.js";

export const ComponentSchemaBase = z.discriminatedUnion("type", [
  HeroSchemaBase,
  FeatureGridSchema,
  CtaBandSchema,
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
}

export const sharedClassNames = [
  "c-button",
  "c-button--primary",
  "c-button--secondary",
] as const;

export const componentDefinitions: readonly ComponentDefinition[] = [
  {
    type: "hero",
    render: (data) => renderHero(HeroSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./hero/hero.css", import.meta.url)),
    classNames: heroClassNames,
  },
  {
    type: "feature-grid",
    render: (data) => renderFeatureGrid(FeatureGridSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./feature-grid/feature-grid.css", import.meta.url)),
    classNames: featureGridClassNames,
  },
  {
    type: "cta-band",
    render: (data) => renderCtaBand(CtaBandSchema.parse(data)),
    cssPath: fileURLToPath(new URL("./cta-band/cta-band.css", import.meta.url)),
    classNames: ctaBandClassNames,
  },
];

export const componentTypeNames = componentDefinitions.map(
  (componentDefinition) => componentDefinition.type,
);

export const renderComponent = (data: ComponentData): string => {
  switch (data.type) {
    case "hero":
      return renderHero(data);
    case "feature-grid":
      return renderFeatureGrid(data);
    case "cta-band":
      return renderCtaBand(data);
    default: {
      throw new Error(`No renderer exists for component '${JSON.stringify(data)}'`);
    }
  }
};
