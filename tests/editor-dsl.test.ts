import { describe, expect, it } from "vitest";
import { z } from "zod";

import { editorFor, defineEditorRegistry } from "../src/editor-dsl/index.js";

describe("editorFor", () => {
  it("builds schema-bound declarative editor data", () => {
    const exampleSchema = z
      .object({
        type: z.literal("example"),
        title: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()),
        priority: z.number().optional(),
        published: z.boolean().optional(),
        tone: z.enum(["plain", "bold"]).default("plain"),
      })
      .strict();

    type ExampleData = z.infer<typeof exampleSchema>;

    const exampleDefaults = {
      type: "example",
      title: "",
      description: "",
      tags: [],
      priority: 0,
      published: false,
      tone: "plain",
    } satisfies ExampleData;

    const example = editorFor(exampleSchema, "type");

    const exampleEditor = example.object({
      type: "example",
      title: "Example",
      defaults: exampleDefaults,
      fields: [
        example.section("Main", [
          example.readonly("type"),
          example.text("title", "Title"),
          example.textarea("description", "Description"),
          example.stringList("tags", "Tags"),
          example.number("priority", "Priority"),
          example.checkbox("published", "Published"),
          example.select("tone", "Tone", [
            { label: "Plain", value: "plain" },
            { label: "Bold", value: "bold" },
          ]),
        ]),
      ],
    });

    expect(exampleEditor).toEqual({
      kind: "object-editor",
      schema: exampleSchema,
      type: "example",
      title: "Example",
      defaults: exampleDefaults,
      fields: [
        {
          kind: "section",
          title: "Main",
          fields: [
            { kind: "readonly", key: "type" },
            { kind: "text", key: "title", label: "Title" },
            { kind: "textarea", key: "description", label: "Description" },
            { kind: "string-list", key: "tags", label: "Tags" },
            { kind: "number", key: "priority", label: "Priority" },
            { kind: "checkbox", key: "published", label: "Published" },
            {
              kind: "select",
              key: "tone",
              label: "Tone",
              options: [
                { label: "Plain", value: "plain" },
                { label: "Bold", value: "bold" },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe("defineEditorRegistry", () => {
  it("returns the registry unchanged for runtime lookups", () => {
    const heroSchema = z.object({ type: z.literal("hero"), heading: z.string() }).strict();
    const proseSchema = z.object({ type: z.literal("prose"), content: z.string() }).strict();

    const hero = editorFor(heroSchema, "type");
    const prose = editorFor(proseSchema, "type");

    const heroEditor = hero.object({
      type: "hero",
      title: "Hero",
      defaults: { type: "hero", heading: "" },
      fields: [hero.section("Main", [hero.text("heading", "Heading")])],
    });

    const proseEditor = prose.object({
      type: "prose",
      title: "Prose",
      defaults: { type: "prose", content: "" },
      fields: [prose.section("Content", [prose.textarea("content", "Content")])],
    });

    const componentSchema = z.discriminatedUnion("type", [heroSchema, proseSchema]);

    const registry = defineEditorRegistry(componentSchema, {
      hero: heroEditor,
      prose: proseEditor,
    });

    expect(registry.hero).toBe(heroEditor);
    expect(registry.prose).toBe(proseEditor);
  });
});
