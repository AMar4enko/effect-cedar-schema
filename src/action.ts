import { AST, Schema, Serializable } from "@effect/schema"
import { IdentifiableEntity, SerializedType } from "./types"
import { Class, optional, TaggedRequest, TaggedRequestClass } from "@effect/schema/Schema"
import { Effect } from "effect"
import { CedarNamespace } from "./annotations.js"
import { SerializedIdentifier } from "./types.js"
import { compile } from "./entity.js"

const ActionTypeId: unique symbol = Symbol(`effect-cedar/ActionTypeId`)

export const DeterminingPolicies = Schema.Array(Schema.Struct({ policyId: Schema.String }))
export const Errors = Schema.Array(Schema.Struct({ errorDescription: Schema.String }))

export const Success = Schema.Struct({
  DeterminingPolicies: DeterminingPolicies
})

export const Failure = Schema.Struct({
  errors: Errors
})

export type ActionPayload<
  Principals extends Schema.Schema<IdentifiableEntity, any, any>[], 
  Resources extends Schema.Schema<IdentifiableEntity, any, any>[],
  Context extends  Schema.Struct<any> = never
> = [Context] extends [never] ? {
    principal: optional<Schema.Union<Principals>>,
    resource: Schema.Union<Resources>
} : {
    principal: optional<Schema.Union<Principals>>,
    resource: Schema.Union<Resources>,
    context: Context,
}

export interface Action<
  Self, 
  Tag extends string, 
  Principals extends Schema.Schema<IdentifiableEntity, any, any>[], 
  Resources extends Schema.Schema<IdentifiableEntity, any, any>[],
  Context extends Schema.Struct<any> = never
> extends Class<
  Self,
  ActionPayload<Principals, Resources, Context>,
  Schema.Struct.Encoded<ActionPayload<Principals, Resources, Context>>,
  Schema.Struct.Context<ActionPayload<Principals, Resources, Context>>,
  Schema.Struct.Constructor<ActionPayload<Principals, Resources, Context>>,
  TaggedRequest<
    Tag,
    Self,
    Schema.Struct.Encoded<ActionPayload<Principals, Resources, Context>>,
    Schema.Struct.Context<ActionPayload<Principals, Resources, Context>>,
    typeof Success.Type,
    typeof Success.Encoded,
    typeof Failure.Type,
    typeof Failure.Encoded,
    typeof Success.Context | typeof Failure.Context
  >,
  {
    readonly _tag: Tag
    readonly success: typeof Success.Type
    readonly failure: typeof Failure.Type
    readonly namespace: string
    serialize(): Effect.Effect<{
      action: {
        actionId: string
        actionType: string
      },
      principal: SerializedIdentifier,
      resource: SerializedIdentifier,
      context?: {
        contextMap: Record<string, SerializedType>
      }
    }>
  }
> {}

export const serializeAction = (ctx?: AST.AST) => {
  const serializeContext = ctx ? compile(ctx) : Effect.succeed

  return (action: InstanceType<Action<any, any, any, any, any>>) => Effect.gen(function* () {
    let res: Record<string, any> = {}

    if (action.principal) {
      res.principal = yield* (action.principal as any).serialize() 
    }

    if (action.context) {
      res.context = yield* serializeContext(action.context)
    }

    const resource = yield* (action.resource as any).serialize()

    return {
      ...res,
      action: {
        actionType: action.namespace,
        actionId: action._tag
      },
      resource,
    }
  })
}

export const Action
  = <Self>() =>
  <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[], Context extends Schema.Struct.Fields = never>(
      tag: Tag,
      args: {
        principals: Principals,
        resources: Resources,
        context?: Context
      },
      namespace: string
    ) => {
      const annotations = namespace ? { [CedarNamespace]: namespace } : undefined
      const payload = {
        principal: Schema.optional(Schema.Union(...args.principals)), 
        resource: Schema.Union(...args.resources),
      }

      const ctx = args.context ? Schema.Struct(args.context) : Schema.Never

      const _serialize = serializeAction(args.context ? ctx.ast : undefined)

      class Cls extends TaggedRequest<Cls>(tag)(tag, {
          success: Success,
          failure: Failure,
          payload: args.context ? {
            ...payload,
            context: ctx
          } : payload
        }, annotations) {
          namespace = namespace
         
          serialize = () => _serialize(this as any)
        }

      Object.defineProperty(Cls, "name", { value: tag });

      return Cls as unknown as Action<Self, Tag, Principals, Resources, [Context] extends [never] ? never : Schema.Struct<Context>>
    }

