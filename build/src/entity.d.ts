import { AST, Schema } from "@effect/schema";
import { Class, Struct } from "@effect/schema/Schema";
import { Effect } from "effect";
import { SerializedIdentifier, FullSerializedType } from "./types.js";
type EntitySchema = Schema.Schema.All & {
    [EntityTypeId]: typeof EntityTypeId;
};
export declare const EntityTypeId: unique symbol;
export type CompilerFunction = (v: unknown) => Effect.Effect<FullSerializedType, Error, never>;
export declare const getEntities: Effect.Effect<{
    identifier: SerializedIdentifier;
    attributes: Record<string, FullSerializedType>;
}[], never, never>;
export type FieldsWithParents<Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never> = [
    MembersOf
] extends [never] ? Fields & {
    id: typeof Schema.String;
} : Fields & {
    id: typeof Schema.String;
    parents: Schema.optional<Schema.Array$<Schema.Union<MembersOf>>>;
};
export interface TaggedClass<Self, Tag extends string, Fields extends Struct.Fields, Proto> extends Class<Self, Fields, Struct.Encoded<Fields>, Struct.Context<Fields>, Struct.Constructor<Omit<Fields, "_tag">>, {}, Proto> {
    readonly _tag: Tag;
}
export interface Entity<Self, Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never> extends TaggedClass<Self, Tag, FieldsWithParents<Fields, MembersOf>, {
    serialize: () => Effect.Effect<FullSerializedType, never, never>;
}> {
    [EntityTypeId]: typeof EntityTypeId;
    readonly _tag: Tag;
}
/**
 * Gotta prohibit entity fields to be classes
 */
export type EntityField<F> = F extends new (...args: any[]) => any ? never : Schema.Schema.All | Schema.PropertySignature.All;
export declare const compile: (ast: AST.AST) => CompilerFunction;
export declare const Entity: <Self>() => <Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never>(tag: Tag, args: {
    fields: Fields;
    membersOf?: MembersOf;
}, namespace: string) => Entity<Self, Tag, Fields, MembersOf>;
export {};
