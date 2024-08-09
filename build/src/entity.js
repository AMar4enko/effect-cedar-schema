import { Schema } from "@effect/schema";
import { TaggedClass } from "@effect/schema/Schema";
import { CedarNamespace } from "./annotations.js";
export const Entity = () => (tag, args, namespace) => {
    const membersOf = Schema.optional(args.membersOf ? Schema.Array(Schema.Union(...args.membersOf)) : Schema.Undefined);
    const annotations = namespace ? { [CedarNamespace]: namespace } : undefined;
    return TaggedClass(tag)(tag, { ...args.fields, id: Schema.String, parents: membersOf }, annotations);
};
