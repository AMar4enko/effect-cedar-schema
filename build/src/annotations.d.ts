import { Annotated } from "@effect/schema/AST";
import { Effect } from 'effect';
import { CedarSchema } from './services.js';
export declare const CedarNamespace: unique symbol;
export declare const getCedarNamespace: (annotated: Annotated) => Effect.Effect<string, never, CedarSchema>;
