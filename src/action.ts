import { AST, Schema, Serializable } from "@effect/schema"
import { IdentifiableEntity } from "./types"
import { TaggedRequest } from "@effect/schema/Schema"
import { Effect, flow, Option } from "effect"
import { CedarNamespace } from "./annotations"

export const DeterminingPolicies = Schema.Array(Schema.Struct({ policyId: Schema.String }))
export const Errors = Schema.Array(Schema.Struct({ errorDescription: Schema.String }))

export const Success = Schema.Struct({
  DeterminingPolicies: DeterminingPolicies
})

export const Failure = Schema.Struct({
  errors: Errors
})

export const Action
  = <Self>() =>
  <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[]>(
      tag: Tag,
      args: {
        principals: Principals,
        resources: Resources
      },
      namespace?: string
    ) => {
      const annotations = namespace ? { [CedarNamespace]: namespace } : undefined
      return TaggedRequest<Self>(tag)(tag, {
          success: Success,
          failure: Failure,
          payload: {
            principal: Schema.Union(...args.principals), 
            resource: Schema.Union(...args.resources)
          }
        }, annotations)
    }

export const ActionWithContext
  = <Self>() =>
  <Tag extends string, Principals extends Schema.Schema<any, any, IdentifiableEntity>[], Resources extends Schema.Schema<any, any, IdentifiableEntity>[], Context extends Record<string, any>>(
      tag: Tag,
      args: {
        principals: Principals,
        resources: Resources,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        context: Schema.Schema<Context, any>
      },
      namespace?: string
    ) => {
      const annotations = namespace ? { [CedarNamespace]: namespace } : undefined
      return TaggedRequest<Self>(tag)(tag, {
        failure: Failure,
        success: Success,
        payload: { 
          principal: Schema.Union(...args.principals), 
          resource: Schema.Union(...args.resources), 
          context: args.context
        }
      }, annotations)
    }
  

export const serializeAction = (a: any) => 
  AST.getAnnotation(
    (Serializable.selfSchema(a).ast as any).to,
    CedarNamespace
  ).pipe(
    Effect.orElseFail(() => new Error(`@cedar-schema/namespace annotation is missing`)),
    Effect.map((ns) => {
      const entities = new Map()
      const { principal, resource, context } = a as any

      const transform = (a: any): any => {  
        if (typeof a === `string`) {
          return a
        }
        if (Array.isArray(a)) {
          return a.map(transform)
        }
        
        if (typeof a._tag !== undefined) {
          const entity = Object.fromEntries(
            Object.entries(a).map(
              ([key, value]): any => {
                switch (key) {
                  case `id`: return [`entityId`, value]
                  case `_tag`: return [`entityType`, value]
                  default: 
                    return [key, transform(value)];
                }
              }
            )
          )
  
          const parents = entity.parents;
          const entityType = [ns, entity.entityType].join(`::`);
          const entityId = entity.entityId;
  
          delete entity.parents;
          delete entity.entityType;
          delete entity.entityId;
  
          entities.set(`${entityType}_${entityId}`, { identifier: { entityType, entityId }, parents, attributes: entity })
  
          return { entityType, entityId }
        }
  
        return a;
      }
  
      return {
        principal: transform(principal),
        resource: transform(resource),
        context: transform(context),
        entities: Array.from(entities.values())
      }
    })
  )