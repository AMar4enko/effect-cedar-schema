import * as Schema from "effect/Schema";
export declare const CedarMemberOf: unique symbol;
export declare const memberOf: <T extends Schema.Struct<Schema.Struct.Fields>[]>(...memberOf: T) => (schema: Schema.Struct<Schema.Struct.Fields>) => Schema.Struct<Schema.Struct.Fields>;
