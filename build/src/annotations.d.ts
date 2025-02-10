import { Annotated } from "effect/SchemaAST";
import * as Effect from 'effect/Effect';
import { CedarSchema } from './services.js';
export declare const CedarNamespace: unique symbol;
export declare const getCedarNamespace: (annotated: Annotated) => Effect.Effect<string, never, CedarSchema>;
