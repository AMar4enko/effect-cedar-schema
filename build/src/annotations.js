import { getAnnotation } from "@effect/schema/AST";
import { Effect } from 'effect';
import { CedarSchema } from './services';
export const CedarNamespace = Symbol(`@cedar-schema/namespace`);
export const getCedarNamespace = (annotated) => getAnnotation(annotated, CedarNamespace).pipe(Effect.orElse(() => CedarSchema.pipe(Effect.map(({ defaultNamespace }) => defaultNamespace))));
