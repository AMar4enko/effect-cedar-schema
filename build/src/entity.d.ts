import { Schema } from "@effect/schema";
type EntitySchema = {
    readonly _tag: string;
};
/**
 * Gotta prohibit entity fields to be classes
 */
export type EntityField<F> = F extends new (...args: any[]) => any ? never : Schema.Schema.All | Schema.PropertySignature.All;
export declare const Entity: <Self>() => <Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = []>(tag: Tag, args: {
    fields: Fields;
    membersOf?: { [key in keyof MembersOf]: Schema.Schema<MembersOf[key], MembersOf[key], never>; } | undefined;
}, namespace?: string) => [Self] extends [never] ? "Missing `Self` generic - use `class Self extends TaggedClass<Self>()(\"Tag\", { ... })`" : Schema.TaggedClass<Self, Tag, {
    readonly _tag: Schema.tag<Tag>;
} & Fields & {
    id: typeof Schema.String;
    parents: Schema.optional<Schema.Array$<Schema.Schema<Schema.Schema.Type<[...{ [key in keyof MembersOf]: Schema.Schema<MembersOf[key], MembersOf[key], never>; }][number]>, Schema.Schema.Encoded<[...{ [key in keyof MembersOf]: Schema.Schema<MembersOf[key], MembersOf[key], never>; }][number]>, Schema.Schema.Context<[...{ [key in keyof MembersOf]: Schema.Schema<MembersOf[key], MembersOf[key], never>; }][number]>>> | typeof Schema.Undefined>;
}>;
export {};
