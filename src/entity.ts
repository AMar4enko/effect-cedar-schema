import * as Schema from "effect/Schema"
import * as AST from "effect/SchemaAST"
import { Class, Struct, TaggedClass as TaggedClassImpl } from "effect/Schema"
import { CedarNamespace } from "./annotations.js"
import { Effect, Equal, FiberRef, identity, Match, Record as R } from "effect"
import { UnknownException } from "effect/Cause"
import { SerializedAttributes, SerializedIdentifier, SerializedType } from "./types.js"
import { IdentifierAnnotationId, isUndefinedKeyword } from "effect/SchemaAST"
import * as Hash from "effect/Hash"

type EntitySchema = Schema.Schema.All & { [EntityTypeId]: typeof EntityTypeId }

export const EntityTypeId: unique symbol = Symbol(`effect-cedar/EntityTypeId`)

export interface SerializedEntity extends Hash.Hash {
  identifier: SerializedIdentifier
  attributes: SerializedAttributes
  parents: SerializedIdentifier[]
}

const EntitiesRef = FiberRef.unsafeMake(new Map<string, SerializedEntity>())

export type CompilerFunction = (v: unknown) => Effect.Effect<SerializedType, Error, never>

export const getEntities = FiberRef.get(EntitiesRef).pipe(
  Effect.map((map) => [...map.values()])
)

export const makeSerialisedEntity = function (identifier: SerializedIdentifier, attributes: SerializedAttributes, parents: SerializedIdentifier[] = []): SerializedEntity {
  const id = { ...identifier }
  const idHash = Hash.hash(`${identifier.entityType}${identifier.entityId}`)
  Hash.cached(id, idHash)
  const o = {
    identifier: id,
    attributes,
    parents
  }

  Hash.cached(o, idHash)

  return o as any
}

export type FieldsWithParents< Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never> = 
  [MembersOf] extends [never] 
    ? Fields & { id: typeof Schema.String }
    : Fields & { id: typeof Schema.String; parents: Schema.optional<Schema.Array$<Schema.Union<MembersOf>>> }


export interface TaggedClass<Self, Tag extends string, Fields extends Struct.Fields, Proto> extends
    Class<
      Self,
      Fields,
      Struct.Encoded<Fields>,
      Struct.Context<Fields>,
      Struct.Constructor<Omit<Fields, "_tag">>,
      object,
      Proto
    >
  {
    readonly _tag: Tag
  }

export interface Entity<Self, Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never> extends 
  TaggedClass<
    Self,
    Tag,
    FieldsWithParents<Fields, MembersOf>,
    {
      serialize: () => Effect.Effect<SerializedEntity, never, never>
    }
  >
  {
    [EntityTypeId]: typeof EntityTypeId
    readonly _tag: Tag
  }

/**
 * Gotta prohibit entity fields to be classes
 */
export type EntityField<F> = F extends new (...args: any[]) => any
  ? never
  : | Schema.Schema.All
    | Schema.PropertySignature.All

export const compile: (ast: AST.AST) => CompilerFunction = Match.type<AST.AST>().pipe(
  Match.when(
      (ast) => ast._tag === `Declaration` && ast.annotations[EntityTypeId] === EntityTypeId,
      () => ((value: InstanceType<Entity<any, any, any, any>>) => value.serialize().pipe(
        Effect.bindTo(`entityIdentifier`)
      )) as any
  ),
  Match.tag(`Transformation`, (ast) => {
    return compile(ast.to)
  }),
  Match.tag(`TupleType`, (ast) => {
    const runCompile = compile(ast.rest[0].type)

    return (value: any[]): Effect.Effect<SerializedType, never, never> => Effect.all(value.map(runCompile)).pipe(
      Effect.tapError(Effect.logError),
      Effect.catchAll(() => Effect.succeed([])),
      Effect.bindTo(`set`)
    )
  }),
  Match.tag(`Union`, (ast): CompilerFunction => {
    const hasUndefined = ast.types.some((type) => isUndefinedKeyword(type))
    const withoutUndefined = ast.types.filter((type) => !isUndefinedKeyword(type))
    if (withoutUndefined.length === 1) {
      return compile(withoutUndefined[0])
    }

    return (value: unknown) => {
      if (value === undefined && hasUndefined) {
        return Effect.succeed(value)
      }

      /** Union here can only be union of multiple entity types, hence we are safe to assume we can serialize it */
      return ((value as any).serialize as any)()
    }
  }),
  Match.tag(`TypeLiteral`, (ast): CompilerFunction => {
    const compilers = R.fromEntries(
      ast.propertySignatures.map((propSignature) => [String(propSignature.name), compile(propSignature.type)] as const)
    )

    return ((value: Record<PropertyKey, any>): Effect.Effect<SerializedType, never, never> => 
      Effect.all(R.map(compilers, (runCompile, key) => runCompile(value[key]))).pipe(
        Effect.tapError(Effect.logError),
        Effect.catchAll(() => Effect.succeed({})),
        Effect.bindTo(`record`)
      )) as any
  }),
  Match.tag(`StringKeyword`, (): CompilerFunction => {
    return ((value: string): Effect.Effect<SerializedType, never, never> => Effect.succeed({ string: value })) as any
  }),
  Match.tag(`NumberKeyword`, (): CompilerFunction => {
    return ((value: number): Effect.Effect<SerializedType, never, never> => Effect.succeed({ long: value })) as any
  }),
  Match.tag(`BooleanKeyword`, (): CompilerFunction => {
    return ((value: boolean): Effect.Effect<SerializedType, never, never> => Effect.succeed({ boolean: value })) as any
  }),
  Match.orElse(() => Effect.succeed)
)
  
const toApiJSON = (schema: Entity<any, any, any, any>) => {
  const ast = schema.ast as AST.Transformation
   if (ast.to._tag !== `Declaration` || (ast.to.typeParameters.length === 0 || ast.to.typeParameters[0]._tag !== `TypeLiteral`)) { 
    throw new UnknownException(`unexpected AST`)
  }
  const typeLiteral = ast.to.typeParameters[0]

  const NS = ast.to.annotations[CedarNamespace]
  const identifier: Record<`entityType` | `entityId`, (value: any) => string> = {
    entityType: () => `${NS}::${ast.to.annotations[IdentifierAnnotationId]}`,
    entityId: identity
  }
  const attributes: Record<string, CompilerFunction> = {}
  
  typeLiteral.propertySignatures.forEach((propSignature) => {
    if (propSignature.name === `id`) {
      identifier.entityId = (value: any) => value.id
    } else if (propSignature.name !== `_tag` && !isUndefinedKeyword(propSignature.type)) {
      attributes[String(propSignature.name)] = compile(propSignature.type)
    }
  })
  
  return (value: Record<PropertyKey, any>): Effect.Effect<SerializedEntity, never, never> => Effect.gen(function* () {
    const a = yield* FiberRef.get(EntitiesRef)

    const key = `${identifier.entityType(value)}_${identifier.entityId(value)}`

    return yield* Effect.fromNullable(a.get(key))
      .pipe(
        Effect.orElse(() => 
          Effect.all(R.map(attributes, (runCompile, key) => runCompile(value[key]))).pipe(
            Effect.map((attr) => {
              const { parents, ...attributes} = attr
              return makeSerialisedEntity(
                R.map(identifier, (a) => a(value)),
                attributes,
                // @ts-ignore
                (parents ? (parents as any).set : []).map(({ entityIdentifier }) => entityIdentifier)
              )
            })
          ).pipe(
            Effect.tap((value) => FiberRef.update(EntitiesRef, (a) => a.set(key, value)))
          )
        ),
        Effect.map(({ identifier }) => identifier)
      )
  }) as any
}

export const Entity
  = <Self>() =>
  <Tag extends string, Fields extends Schema.Struct.Fields, MembersOf extends EntitySchema[] = never>(
    tag: Tag, 
    args: {
      fields: Fields,
      membersOf?: MembersOf
    },
    namespace: string
  ): Entity<Self, Tag, Fields, MembersOf> => {
      const membersOf = Schema.optional(args.membersOf ? Schema.Array(Schema.Union(...args.membersOf)) : Schema.Undefined)
      const annotations = namespace ? { [CedarNamespace]: namespace } : undefined
      const base = (TaggedClassImpl<Self>(tag)(tag, { ...args.fields, id: Schema.String, parents: membersOf }, { ...annotations, [EntityTypeId]: EntityTypeId }) as any)

      const serialize = toApiJSON(base)

      class Class extends base {
        [EntityTypeId] = EntityTypeId
        namespace = namespace

        serialize() {
          return serialize(this)
        }
      }

      return Class as any
    }