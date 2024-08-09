import { Schema } from "@effect/schema";
import { IdentifiableEntity } from "./types";
import { Effect } from "effect";
export declare const DeterminingPolicies: Schema.Array$<Schema.Struct<{
    policyId: typeof Schema.String;
}>>;
export declare const Errors: Schema.Array$<Schema.Struct<{
    errorDescription: typeof Schema.String;
}>>;
export declare const Success: Schema.Struct<{
    DeterminingPolicies: Schema.Array$<Schema.Struct<{
        policyId: typeof Schema.String;
    }>>;
}>;
export declare const Failure: Schema.Struct<{
    errors: Schema.Array$<Schema.Struct<{
        errorDescription: typeof Schema.String;
    }>>;
}>;
export declare const Action: <Self>() => <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[]>(tag: Tag, args: {
    principals: Principals;
    resources: Resources;
}, namespace?: string) => [Self] extends [never] ? "Missing `Self` generic - use `class Self extends TaggedRequest<Self>()(\"Tag\", SuccessSchema, FailureSchema, { ... })`" : Schema.TaggedRequestClass<Self, Tag, {
    readonly _tag: Schema.tag<Tag>;
} & {
    principal: Schema.Schema<Schema.Schema.Type<Principals[number]>, Schema.Schema.Encoded<Principals[number]>, Schema.Schema.Context<Principals[number]>>;
    resource: Schema.Schema<Schema.Schema.Type<Resources[number]>, Schema.Schema.Encoded<Resources[number]>, Schema.Schema.Context<Resources[number]>>;
}, Schema.Struct<{
    DeterminingPolicies: Schema.Array$<Schema.Struct<{
        policyId: typeof Schema.String;
    }>>;
}>, Schema.Struct<{
    errors: Schema.Array$<Schema.Struct<{
        errorDescription: typeof Schema.String;
    }>>;
}>>;
export declare const ActionWithContext: <Self>() => <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[], Context extends Record<string, any>>(tag: Tag, args: {
    principals: Principals;
    resources: Resources;
    context: Schema.Schema<Context, any, never>;
}, namespace?: string) => [Self] extends [never] ? "Missing `Self` generic - use `class Self extends TaggedRequest<Self>()(\"Tag\", SuccessSchema, FailureSchema, { ... })`" : Schema.TaggedRequestClass<Self, Tag, {
    readonly _tag: Schema.tag<Tag>;
} & {
    principal: Schema.Schema<Schema.Schema.Type<Principals[number]>, Schema.Schema.Encoded<Principals[number]>, Schema.Schema.Context<Principals[number]>>;
    resource: Schema.Schema<Schema.Schema.Type<Resources[number]>, Schema.Schema.Encoded<Resources[number]>, Schema.Schema.Context<Resources[number]>>;
    context: Schema.Schema<Context, any, never>;
}, Schema.Struct<{
    DeterminingPolicies: Schema.Array$<Schema.Struct<{
        policyId: typeof Schema.String;
    }>>;
}>, Schema.Struct<{
    errors: Schema.Array$<Schema.Struct<{
        errorDescription: typeof Schema.String;
    }>>;
}>>;
export declare const serializeAction: (a: any) => Effect.Effect<{
    principal: any;
    resource: any;
    context: any;
    entities: any[];
}, Error, never>;
