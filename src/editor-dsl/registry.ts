import { z } from "zod";

import type { FieldDef } from "./field-defs.js";
import type { ObjectEditorDef } from "./object-editor-def.js";

type DiscriminatorValue<
  TDiscriminator extends string,
  TOption extends z.ZodDiscriminatedUnionOption<TDiscriminator>,
> = z.infer<TOption>[TDiscriminator] & string;

type UnionDiscriminatorValues<
  TDiscriminator extends string,
  TOptions extends readonly z.ZodDiscriminatedUnionOption<TDiscriminator>[],
> = DiscriminatorValue<TDiscriminator, TOptions[number]>;

type OptionForDiscriminatorValue<
  TDiscriminator extends string,
  TOptions extends readonly z.ZodDiscriminatedUnionOption<TDiscriminator>[],
  TValue extends string,
> = TOptions[number] extends infer TOption
  ? TOption extends z.ZodDiscriminatedUnionOption<TDiscriminator>
    ? DiscriminatorValue<TDiscriminator, TOption> extends TValue
      ? TOption
      : never
    : never
  : never;

export type EditorRegistryForUnion<
  TDiscriminator extends string,
  TOptions extends readonly z.ZodDiscriminatedUnionOption<TDiscriminator>[],
> = {
  [K in UnionDiscriminatorValues<TDiscriminator, TOptions>]: ObjectEditorDef<
    OptionForDiscriminatorValue<TDiscriminator, TOptions, K>,
    K,
    FieldDef<string>
  >;
};

export function defineEditorRegistry<
  TDiscriminator extends string,
  TOptions extends readonly [
    z.ZodDiscriminatedUnionOption<TDiscriminator>,
    ...z.ZodDiscriminatedUnionOption<TDiscriminator>[],
  ],
>(
  _union: z.ZodDiscriminatedUnion<TDiscriminator, TOptions>,
  registry: EditorRegistryForUnion<TDiscriminator, TOptions>,
): EditorRegistryForUnion<TDiscriminator, TOptions> {
  return registry;
}
