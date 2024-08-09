import { Schema, AST } from '@effect/schema';
import { Effect } from 'effect';
import { IdentifiableEntity } from './types';
import { PropertySignature } from '@effect/schema/Schema';
import { CedarSchema } from './services.js';
export * from './action.js';
export * from './entity.js';
declare const UnsupportedSchema_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "UnsupportedSchema";
} & Readonly<A>;
declare class UnsupportedSchema extends UnsupportedSchema_base<{
    ast: AST.AST;
    message?: string;
}> {
    toJSON(): {
        message: string;
        ast: string;
    };
}
export declare const compileAttributeType: (ast: AST.AST, required?: boolean) => Effect.Effect<Record<string, any>, UnsupportedSchema, CedarSchema>;
export type Action = {
    principals: readonly IdentifiableEntity[];
    resources: readonly IdentifiableEntity[];
    context?: Schema.Schema.Any;
};
export interface ActionNewable {
    new (props: any, options: {
        disableValidation?: boolean;
    }): Schema.TaggedRequest<any, any, any, any, any, any, any, any, any>;
    ast: AST.AST;
    fields: Schema.Struct.Fields;
}
export declare const normalizePropType: (ast: AST.AST | PropertySignature.AST) => AST.AST;
export declare const compileEntityClass: (ast: AST.Transformation) => Effect.Effect<{
    name: string;
    entity: Record<string, any>;
}, UnsupportedSchema, CedarSchema>;
export declare const compileEntity: (ast: AST.AST) => Effect.Effect<{
    name: string;
    entity: Record<string, any>;
}, UnsupportedSchema, CedarSchema>;
export declare const compileAction: <A extends Action>(A: ActionNewable) => Effect.Effect<void, UnsupportedSchema, CedarSchema>;
export declare const compileFromActions: <Actions extends Action[]>(actions: { [key in keyof Actions]: ActionNewable; }) => Effect.Effect<{
    [k: string]: {
        commonTypes: {
            [k: string]: Record<string, any>;
        };
        entityTypes: {
            [k: string]: Record<string, any>;
        };
        actions: {
            [k: string]: Record<string, any>;
        };
    };
}, UnsupportedSchema, CedarSchema>;
