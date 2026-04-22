import { z } from "zod";

import type { FieldDef, SectionDef } from "./field-defs.js";
import type { AnyZodObject } from "./types.js";

export type ObjectEditorDef<
  TSchema extends AnyZodObject,
  TType extends string,
  TField extends FieldDef<string>,
> = {
  kind: "object-editor";
  schema: TSchema;
  type: TType;
  title: string;
  defaults: z.infer<TSchema>;
  fields: readonly SectionDef<TField>[];
};
