export type ReadonlyFieldDef<TKey extends string> = {
  kind: "readonly";
  key: TKey;
};

export type TextFieldDef<TKey extends string> = {
  kind: "text";
  key: TKey;
  label: string;
  optional?: boolean;
};

export type MediaFieldDef<TKey extends string> = {
  kind: "media";
  key: TKey;
  label: string;
  optional?: boolean;
};

export type TextAreaFieldDef<TKey extends string> = {
  kind: "textarea";
  key: TKey;
  label: string;
  optional?: boolean;
};

export type NumberFieldDef<TKey extends string> = {
  kind: "number";
  key: TKey;
  label: string;
  optional?: boolean;
};

export type CheckboxFieldDef<TKey extends string> = {
  kind: "checkbox";
  key: TKey;
  label: string;
  optional?: boolean;
};

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type SelectFieldDef<TKey extends string, TValue extends string = string> = {
  kind: "select";
  key: TKey;
  label: string;
  options?: readonly (SelectOption<TValue> | TValue)[];
  optional?: boolean;
};

export type StringListFieldDef<TKey extends string> = {
  kind: "string-list";
  key: TKey;
  label: string;
  createItem?: string;
  optional?: boolean;
};

export type ObjectFieldDef<TKey extends string> = {
  kind: "object";
  key: TKey;
  label: string;
  fields: readonly FieldDef<string>[];
};

export type OptionalObjectFieldDef<TKey extends string> = {
  kind: "optional-object";
  key: TKey;
  label: string;
  createValue: Record<string, unknown>;
  fields: readonly FieldDef<string>[];
};

export type ObjectListFieldDef<TKey extends string> = {
  kind: "object-list";
  key: TKey;
  label: string;
  createItem: Record<string, unknown>;
  itemLabelKey?: string;
  fields: readonly FieldDef<string>[];
};

export type FieldDef<TKey extends string> =
  | ReadonlyFieldDef<TKey>
  | TextFieldDef<TKey>
  | MediaFieldDef<TKey>
  | TextAreaFieldDef<TKey>
  | NumberFieldDef<TKey>
  | CheckboxFieldDef<TKey>
  | SelectFieldDef<TKey>
  | StringListFieldDef<TKey>
  | ObjectFieldDef<TKey>
  | OptionalObjectFieldDef<TKey>
  | ObjectListFieldDef<TKey>;

export type SectionDef<TField> = {
  kind: "section";
  title: string;
  fields: readonly TField[];
};
