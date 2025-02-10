import * as Schema from "effect/Schema";
import * as AST from "effect/SchemaAST";
import { IdentifiableEntity, SerializedType } from "./types";
import { Class, optional, TaggedRequest } from "effect/Schema";
import { Effect } from "effect";
import { SerializedIdentifier } from "./types.js";
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
export type ActionPayload<Principals extends Schema.Schema<IdentifiableEntity, any, any>[], Resources extends Schema.Schema<IdentifiableEntity, any, any>[], Context extends Schema.Struct<any> = never> = [Context] extends [never] ? {
    principal: optional<Schema.Union<Principals>>;
    resource: Schema.Union<Resources>;
} : {
    principal: optional<Schema.Union<Principals>>;
    resource: Schema.Union<Resources>;
    context: Context;
};
export interface Action<Self, Tag extends string, Principals extends Schema.Schema<IdentifiableEntity, any, any>[], Resources extends Schema.Schema<IdentifiableEntity, any, any>[], Context extends Schema.Struct<any> = never> extends Class<Self, ActionPayload<Principals, Resources, Context>, Schema.Struct.Encoded<ActionPayload<Principals, Resources, Context>>, Schema.Struct.Context<ActionPayload<Principals, Resources, Context>>, Schema.Struct.Constructor<ActionPayload<Principals, Resources, Context>>, TaggedRequest<Tag, Self, Schema.Struct.Encoded<ActionPayload<Principals, Resources, Context>>, Schema.Struct.Context<ActionPayload<Principals, Resources, Context>>, typeof Success.Type, typeof Success.Encoded, typeof Failure.Type, typeof Failure.Encoded, typeof Success.Context | typeof Failure.Context>, {
    readonly _tag: Tag;
    readonly success: typeof Success.Type;
    readonly failure: typeof Failure.Type;
    readonly namespace: string;
    serialize(): Effect.Effect<{
        action: {
            actionId: string;
            actionType: string;
        };
        principal: SerializedIdentifier;
        resource: SerializedIdentifier;
        context?: {
            contextMap: Record<string, SerializedType>;
        };
    }>;
}> {
}
export declare const serializeAction: (ctx?: AST.AST) => (action: InstanceType<Action<any, any, any, any, any>>) => Effect.Effect<{
    action: {
        actionType: string;
        actionId: any;
    };
    resource: any;
}, unknown, unknown>;
export declare const Action: <Self>() => <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[], Context extends Schema.Struct.Fields = never>(tag: Tag, args: {
    principals: Principals;
    resources: Resources;
    context?: Context;
}, namespace: string) => Action<Self, Tag, Principals, Resources, [Context] extends [never] ? never : Schema.Struct<Context>>;
