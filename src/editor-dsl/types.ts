import { z } from "zod";

export type AnyZodObject = z.ZodObject<z.ZodRawShape, z.UnknownKeysParam, z.ZodTypeAny>;

export type InferData<TSchema extends AnyZodObject> = z.infer<TSchema>;

export type InferShape<TSchema extends AnyZodObject> =
  TSchema extends z.ZodObject<infer TShape, z.UnknownKeysParam, z.ZodTypeAny> ? TShape : never;

type UnwrapOptional<TSchema extends z.ZodTypeAny> =
  TSchema extends z.ZodOptional<infer TInner> ? UnwrapWrappers<TInner> : TSchema;

type UnwrapNullable<TSchema extends z.ZodTypeAny> =
  TSchema extends z.ZodNullable<infer TInner> ? UnwrapWrappers<TInner> : TSchema;

type UnwrapDefault<TSchema extends z.ZodTypeAny> =
  TSchema extends z.ZodDefault<infer TInner> ? UnwrapWrappers<TInner> : TSchema;

type UnwrapEffects<TSchema extends z.ZodTypeAny> =
  TSchema extends z.ZodEffects<infer TInner> ? UnwrapWrappers<TInner> : TSchema;

export type UnwrapWrappers<TSchema extends z.ZodTypeAny> = UnwrapEffects<
  UnwrapDefault<UnwrapNullable<UnwrapOptional<TSchema>>>
>;

type ShapeKey<TSchema extends AnyZodObject> = keyof InferShape<TSchema> & string;

type FieldSchema<
  TSchema extends AnyZodObject,
  TKey extends ShapeKey<TSchema>,
> = InferShape<TSchema>[TKey];

type IsAssignableField<
  TField extends z.ZodTypeAny,
  TAllowed extends z.ZodTypeAny,
> = UnwrapWrappers<TField> extends TAllowed ? true : false;

type KeysMatchingSchema<
  TSchema extends AnyZodObject,
  TAllowed extends z.ZodTypeAny,
> = {
  [K in ShapeKey<TSchema>]: IsAssignableField<FieldSchema<TSchema, K>, TAllowed> extends true
    ? K
    : never;
}[ShapeKey<TSchema>];

export type AllKeys<TSchema extends AnyZodObject> = ShapeKey<TSchema>;

export type StringKeys<TSchema extends AnyZodObject> = KeysMatchingSchema<TSchema, z.ZodString>;

export type NumberKeys<TSchema extends AnyZodObject> = KeysMatchingSchema<TSchema, z.ZodNumber>;

export type BooleanKeys<TSchema extends AnyZodObject> = KeysMatchingSchema<
  TSchema,
  z.ZodBoolean
>;

export type StringArrayKeys<TSchema extends AnyZodObject> = {
  [K in ShapeKey<TSchema>]: UnwrapWrappers<FieldSchema<TSchema, K>> extends z.ZodArray<
    infer TItem
  >
    ? UnwrapWrappers<TItem> extends z.ZodString
      ? K
      : never
    : never;
}[ShapeKey<TSchema>];

export type ObjectKeys<TSchema extends AnyZodObject> = KeysMatchingSchema<TSchema, AnyZodObject>;

export type ObjectArrayKeys<TSchema extends AnyZodObject> = {
  [K in ShapeKey<TSchema>]: UnwrapWrappers<FieldSchema<TSchema, K>> extends z.ZodArray<
    infer TItem
  >
    ? UnwrapWrappers<TItem> extends AnyZodObject
      ? K
      : never
    : never;
}[ShapeKey<TSchema>];

export type SelectKeys<TSchema extends AnyZodObject> = {
  [K in ShapeKey<TSchema>]: NonNullable<InferData<TSchema>[K]> extends string ? K : never;
}[ShapeKey<TSchema>];

export type SelectValue<
  TSchema extends AnyZodObject,
  TKey extends SelectKeys<TSchema>,
> = Extract<NonNullable<InferData<TSchema>[TKey]>, string>;

export type DiscriminatorValue<
  TSchema extends AnyZodObject,
  TDiscriminator extends ShapeKey<TSchema>,
> = InferData<TSchema>[TDiscriminator] extends string
  ? InferData<TSchema>[TDiscriminator]
  : never;
