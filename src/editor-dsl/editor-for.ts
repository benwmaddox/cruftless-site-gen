import { z } from "zod";

import type {
  CheckboxFieldDef,
  FieldDef,
  NumberFieldDef,
  ObjectFieldDef,
  ObjectListFieldDef,
  OptionalObjectFieldDef,
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
  ObjectArrayKeys,
  ObjectKeys,
  SelectKeys,
  SelectValue,
  StringArrayKeys,
  StringKeys,
} from "./types.js";

const isOptionalField = (schema: AnyZodObject, key: string): boolean => {
  const fieldSchema = schema.shape[key];
  return Boolean(fieldSchema?.isOptional());
};

const optionalFlag = (schema: AnyZodObject, key: string): { optional: true } | {} =>
  isOptionalField(schema, key) ? { optional: true } : {};

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
    createItem?: string,
  ): StringListFieldDef<TKey>;

  objectField<TKey extends ObjectKeys<TSchema>>(
    key: TKey,
    label: string,
    fields: readonly FieldDef<string>[],
  ): ObjectFieldDef<TKey>;

  optionalObject<TKey extends ObjectKeys<TSchema>>(
    key: TKey,
    label: string,
    createValue: Record<string, unknown>,
    fields: readonly FieldDef<string>[],
  ): OptionalObjectFieldDef<TKey>;

  objectList<TKey extends ObjectArrayKeys<TSchema>>(
    key: TKey,
    label: string,
    createItem: Record<string, unknown>,
    fields: readonly FieldDef<string>[],
    options?: { itemLabelKey?: string },
  ): ObjectListFieldDef<TKey>;

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
        ...optionalFlag(schema, key),
      };
    },

    textarea(key, label) {
      return {
        kind: "textarea",
        key,
        label,
        ...optionalFlag(schema, key),
      };
    },

    number(key, label) {
      return {
        kind: "number",
        key,
        label,
        ...optionalFlag(schema, key),
      };
    },

    checkbox(key, label) {
      return {
        kind: "checkbox",
        key,
        label,
        ...optionalFlag(schema, key),
      };
    },

    select(key, label, options) {
      return {
        kind: "select",
        key,
        label,
        options,
        ...optionalFlag(schema, key),
      };
    },

    stringList(key, label, createItem) {
      return {
        kind: "string-list",
        key,
        label,
        createItem,
        ...optionalFlag(schema, key),
      };
    },

    objectField(key, label, fields) {
      return {
        kind: "object",
        key,
        label,
        fields,
      };
    },

    optionalObject(key, label, createValue, fields) {
      return {
        kind: "optional-object",
        key,
        label,
        createValue,
        fields,
      };
    },

    objectList(key, label, createItem, fields, options) {
      return {
        kind: "object-list",
        key,
        label,
        createItem,
        itemLabelKey: options?.itemLabelKey,
        fields,
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
