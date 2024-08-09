import { getOrElse, getOrThrow, getOrThrowWith } from 'effect/Option'
import { Annotated, getAnnotation } from "@effect/schema/AST"
import { Effect } from 'effect'
import { CedarSchema } from './services.js'

export const CedarNamespace = Symbol(`@cedar-schema/namespace`)

export const getCedarNamespace = (annotated: Annotated) => getAnnotation<string>(annotated, CedarNamespace).pipe(
  Effect.orElse(() => CedarSchema.pipe(Effect.map(({ defaultNamespace }) => defaultNamespace)))
)