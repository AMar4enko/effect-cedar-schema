import { Schema } from "@effect/schema"
import { TaggedClass } from "@effect/schema/Schema"
import { CedarNamespace } from "./annotations.js"

type EntitySchema = { readonly _tag: string }

/**
 * Gotta prohibit entity fields to be classes
 */
export type EntityField<F> = F extends new (...args: any[]) => any
  ? never
  : | Schema.Schema.All
    | Schema.PropertySignature.All

    export const Entity
  = <Self>() =>
  <Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = []>(
    tag: Tag, 
    args: {
      fields: Fields,
      membersOf?: {[key in keyof MembersOf]: Schema.Schema<MembersOf[key]>}
    },
    namespace?: string
  ) => {
      const membersOf = Schema.optional(args.membersOf ? Schema.Array(Schema.Union(...args.membersOf)) : Schema.Undefined)
      const annotations = namespace ? { [CedarNamespace]: namespace } : undefined
      return TaggedClass<Self>(tag)(tag, { ...args.fields, id: Schema.String, parents: membersOf }, annotations)
    }