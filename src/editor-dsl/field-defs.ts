export type ReadonlyFieldDef<TKey extends string> = {
  kind: "readonly";
  key: TKey;
};

export type TextFieldDef<TKey extends string> = {
  kind: "text";
  key: TKey;
  label: string;
};

export type TextAreaFieldDef<TKey extends string> = {
  kind: "textarea";
  key: TKey;
  label: string;
};

export type NumberFieldDef<TKey extends string> = {
  kind: "number";
  key: TKey;
  label: string;
};

export type CheckboxFieldDef<TKey extends string> = {
  kind: "checkbox";
  key: TKey;
  label: string;
};

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type SelectFieldDef<TKey extends string, TValue extends string = string> = {
  kind: "select";
  key: TKey;
  label: string;
  options?: readonly SelectOption<TValue>[];
};

export type StringListFieldDef<TKey extends string> = {
  kind: "string-list";
  key: TKey;
  label: string;
};

export type FieldDef<TKey extends string> =
  | ReadonlyFieldDef<TKey>
  | TextFieldDef<TKey>
  | TextAreaFieldDef<TKey>
  | NumberFieldDef<TKey>
  | CheckboxFieldDef<TKey>
  | SelectFieldDef<TKey>
  | StringListFieldDef<TKey>;

export type SectionDef<TField> = {
  kind: "section";
  title: string;
  fields: readonly TField[];
};
