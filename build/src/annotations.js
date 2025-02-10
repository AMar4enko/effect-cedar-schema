import { getAnnotation } from "effect/SchemaAST";
import * as Effect from 'effect/Effect';
import { CedarSchema } from './services.js';
export const CedarNamespace = Symbol(`@cedar-schema/namespace`);
export const getCedarNamespace = (annotated) => getAnnotation(annotated, CedarNamespace).pipe(Effect.orElse(() => CedarSchema.pipe(Effect.map(({ defaultNamespace }) => defaultNamespace))));
