import { z } from "zod";

import type {
  CheckboxFieldDef,
  FieldDef,
  NumberFieldDef,
  ReadonlyFieldDef,
  SectionDef,
  SelectFieldDef,
  SelectOption,
  StringListFieldDef,
  TextAreaFieldDef,
  TextFieldDef,
} from "./field-defs.js";
import type { ObjectEditorDef } from "./object-editor-def.js";
import type {
  AllKeys,
  AnyZodObject,
  BooleanKeys,
  DiscriminatorValue,
  NumberKeys,
  SelectKeys,
  SelectValue,
  StringArrayKeys,
  StringKeys,
} from "./types.js";

export type EditorFor<
  TSchema extends AnyZodObject,
  TDiscriminator extends AllKeys<TSchema>,
> = {
  readonly<TKey extends AllKeys<TSchema>>(key: TKey): ReadonlyFieldDef<TKey>;

  text<TKey extends StringKeys<TSchema>>(key: TKey, label: string): TextFieldDef<TKey>;

  textarea<TKey extends StringKeys<TSchema>>(key: TKey, label: string): TextAreaFieldDef<TKey>;

  number<TKey extends NumberKeys<TSchema>>(key: TKey, label: string): NumberFieldDef<TKey>;

  checkbox<TKey extends BooleanKeys<TSchema>>(key: TKey, label: string): CheckboxFieldDef<TKey>;

  select<TKey extends SelectKeys<TSchema>>(
    key: TKey,
    label: string,
    options?: readonly SelectOption<SelectValue<TSchema, TKey>>[],
  ): SelectFieldDef<TKey, SelectValue<TSchema, TKey>>;

  stringList<TKey extends StringArrayKeys<TSchema>>(
    key: TKey,
    label: string,
  ): StringListFieldDef<TKey>;

  section<TField extends FieldDef<AllKeys<TSchema>>>(
    title: string,
    fields: readonly TField[],
  ): SectionDef<TField>;

  object<TType extends DiscriminatorValue<TSchema, TDiscriminator>>(config: {
    type: TType;
    title: string;
    defaults: z.infer<TSchema>;
    fields: readonly SectionDef<FieldDef<AllKeys<TSchema>>>[];
  }): ObjectEditorDef<TSchema, TType, FieldDef<AllKeys<TSchema>>>;
};

export function editorFor<
  TSchema extends AnyZodObject,
  TDiscriminator extends AllKeys<TSchema>,
>(schema: TSchema, _discriminator: TDiscriminator): EditorFor<TSchema, TDiscriminator> {
  return {
    readonly(key) {
      return {
        kind: "readonly",
        key,
      };
    },

    text(key, label) {
      return {
        kind: "text",
        key,
        label,
      };
    },

    textarea(key, label) {
      return {
        kind: "textarea",
        key,
        label,
      };
    },

    number(key, label) {
      return {
        kind: "number",
        key,
        label,
      };
    },

    checkbox(key, label) {
      return {
        kind: "checkbox",
        key,
        label,
      };
    },

    select(key, label, options) {
      return {
        kind: "select",
        key,
        label,
        options,
      };
    },

    stringList(key, label) {
      return {
        kind: "string-list",
        key,
        label,
      };
    },

    section(title, fields) {
      return {
        kind: "section",
        title,
        fields,
      };
    },

    object(config) {
      return {
        kind: "object-editor",
        schema,
        type: config.type,
        title: config.title,
        defaults: config.defaults,
        fields: config.fields,
      };
    },
  };
}
