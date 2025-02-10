import * as Schema from "effect/Schema"

export const CedarMemberOf = Symbol(`@cedar-schema/memberOf`)

export const memberOf = <T extends Schema.Struct<Schema.Struct.Fields>[]>(...memberOf: T) => 
  (schema: Schema.Struct<Schema.Struct.Fields>) => Schema.annotations(schema, { [CedarMemberOf]: memberOf.map(({ ast }) => ast)})
  