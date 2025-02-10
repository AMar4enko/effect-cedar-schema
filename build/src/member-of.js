import * as Schema from "effect/Schema";
export const CedarMemberOf = Symbol(`@cedar-schema/memberOf`);
export const memberOf = (...memberOf) => (schema) => Schema.annotations(schema, { [CedarMemberOf]: memberOf.map(({ ast }) => ast) });
