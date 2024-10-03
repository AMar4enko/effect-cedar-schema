import { Schema } from "@effect/schema";
import { TaggedClass as TaggedClassImpl } from "@effect/schema/Schema";
import { CedarNamespace } from "./annotations.js";
import { Effect, FiberRef, identity, Match, Record as R } from "effect";
import { UnknownException } from "effect/Cause";
import { IdentifierAnnotationId, isUndefinedKeyword } from "@effect/schema/AST";
import * as Hash from "effect/Hash";
export const EntityTypeId = Symbol(`effect-cedar/EntityTypeId`);
const EntitiesRef = FiberRef.unsafeMake(new Map());
export const getEntities = FiberRef.get(EntitiesRef).pipe(Effect.map((map) => [...map.values()]));
export const makeSerialisedEntity = function (identifier, attributes, parents) {
    const id = { ...identifier };
    const idHash = Hash.hash(`${identifier.entityType}${identifier.entityId}`);
    Hash.cached(id, idHash);
    const o = {
        identifier: id,
        attributes,
        parents
    };
    Hash.cached(o, idHash);
    return o;
};
export const compile = Match.type().pipe(Match.when((ast) => ast._tag === `Declaration` && ast.annotations[EntityTypeId] === EntityTypeId, () => ((value) => value.serialize().pipe(Effect.bindTo(`entityIdentifier`)))), Match.tag(`Transformation`, (ast) => {
    return compile(ast.to);
}), Match.tag(`TupleType`, (ast) => {
    const runCompile = compile(ast.rest[0].type);
    return (value) => Effect.all(value.map(runCompile)).pipe(Effect.tapError(Effect.logError), Effect.catchAll(() => Effect.succeed([])), Effect.bindTo(`set`));
}), Match.tag(`Union`, (ast) => {
    const hasUndefined = ast.types.some((type) => isUndefinedKeyword(type));
    const withoutUndefined = ast.types.filter((type) => !isUndefinedKeyword(type));
    if (withoutUndefined.length === 1) {
        return compile(withoutUndefined[0]);
    }
    return (value) => {
        if (value === undefined && hasUndefined) {
            return Effect.succeed(value);
        }
        /** Union here can only be union of multiple entity types, hence we are safe to assume we can serialize it */
        return value.serialize();
    };
}), Match.tag(`TypeLiteral`, (ast) => {
    const compilers = R.fromEntries(ast.propertySignatures.map((propSignature) => [String(propSignature.name), compile(propSignature.type)]));
    return ((value) => Effect.all(R.map(compilers, (runCompile, key) => runCompile(value[key]))).pipe(Effect.tapError(Effect.logError), Effect.catchAll(() => Effect.succeed({})), Effect.bindTo(`record`)));
}), Match.tag(`StringKeyword`, () => {
    return ((value) => Effect.succeed({ string: value }));
}), Match.tag(`NumberKeyword`, () => {
    return ((value) => Effect.succeed({ long: value }));
}), Match.tag(`BooleanKeyword`, () => {
    return ((value) => Effect.succeed({ boolean: value }));
}), Match.orElse(() => Effect.succeed));
const toApiJSON = (schema) => {
    const ast = schema.ast;
    if (ast.to._tag !== `Declaration` || (ast.to.typeParameters.length === 0 || ast.to.typeParameters[0]._tag !== `TypeLiteral`)) {
        throw new UnknownException(`unexpected AST`);
    }
    else { }
    const typeLiteral = ast.to.typeParameters[0];
    const NS = ast.to.annotations[CedarNamespace];
    const identifier = {
        entityType: () => `${NS}::${ast.to.annotations[IdentifierAnnotationId]}`,
        entityId: identity
    };
    const attributes = {};
    typeLiteral.propertySignatures.forEach((propSignature) => {
        if (propSignature.name === `id`) {
            identifier.entityId = (value) => value[`id`];
        }
        else if (propSignature.name !== `_tag` && !isUndefinedKeyword(propSignature.type)) {
            attributes[String(propSignature.name)] = compile(propSignature.type);
        }
    });
    return (value) => Effect.gen(function* () {
        const a = yield* FiberRef.get(EntitiesRef);
        const key = `${identifier.entityType(value)}_${identifier.entityId(value)}`;
        return yield* Effect.fromNullable(a.get(key))
            .pipe(Effect.orElse(() => Effect.all(R.map(attributes, (runCompile, key) => runCompile(value[key]))).pipe(Effect.map((attr) => {
            const { parents, ...attributes } = attr;
            return makeSerialisedEntity(R.map(identifier, (a) => a(value)), attributes, 
            // @ts-ignore
            (parents ? parents.set : []).map(({ entityIdentifier }) => entityIdentifier));
        })).pipe(Effect.tap((value) => FiberRef.update(EntitiesRef, (a) => a.set(key, value))))), Effect.map(({ identifier }) => identifier));
    });
};
export const Entity = () => (tag, args, namespace) => {
    const membersOf = Schema.optional(args.membersOf ? Schema.Array(Schema.Union(...args.membersOf)) : Schema.Undefined);
    const annotations = namespace ? { [CedarNamespace]: namespace } : undefined;
    const base = TaggedClassImpl(tag)(tag, { ...args.fields, id: Schema.String, parents: membersOf }, { ...annotations, [EntityTypeId]: EntityTypeId });
    const serialize = toApiJSON(base);
    class Class extends base {
        [EntityTypeId] = EntityTypeId;
        namespace = namespace;
        serialize() {
            return serialize(this);
        }
    }
    return Class;
};
