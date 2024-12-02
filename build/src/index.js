import { AST } from '@effect/schema';
import { Console, Effect, Match, Option, pipe } from 'effect';
import { TaggedError } from 'effect/Data';
import { CedarSchema } from './services.js';
import { getCedarNamespace } from './annotations.js';
import { isUndefinedKeyword } from '@effect/schema/AST';
export * from './action.js';
export * from './entity.js';
const astMatcher = Match.type();
class UnsupportedSchema extends TaggedError(`UnsupportedSchema`) {
    toJSON() {
        return {
            message: `Schema is not supported`,
            ast: JSON.stringify(this.ast.toJSON(), null, 2)
        };
    }
}
const compilePropSignatures = (props) => Effect.gen(function* () {
    const schema = yield* CedarSchema;
    const compiledProps = Object.fromEntries(props
        .filter((prop) => {
        return String(prop.name) !== `_tag`;
    })
        .map(({ name, type, isOptional }) => {
        return [
            String(name),
            compileAttributeType(type, !isOptional)
        ];
    }));
    return yield* Effect.all(compiledProps);
});
export const compileAttributeType = (ast, required = false) => Effect.gen(function* () {
    const maybeUseCommonType = (compileType) => Effect.gen(function* () {
        const id = Option.getOrUndefined(AST.getIdentifierAnnotation(ast));
        const cedarSchema = yield* CedarSchema;
        const namespace = yield* getCedarNamespace(ast);
        const namespaceMap = cedarSchema.namespace.get(namespace)
            ?? cedarSchema.namespace.set(namespace, { actions: new Map(), commonTypes: new Map(), entityTypes: new Map() }).get(namespace);
        if (!id) {
            return yield* compileType;
        }
        return yield* Effect.fromNullable(namespaceMap.commonTypes.get(id))
            .pipe(Effect.catchTag(`NoSuchElementException`, () => {
            return compileType
                .pipe(Effect.tap(({ required, ...type }) => Effect.sync(() => namespaceMap.commonTypes.set(id, type))), Effect.map(() => ({ type: id })));
        }));
    });
    const compileType = astMatcher.pipe(Match.tags({
        StringKeyword: () => Effect.succeed({
            type: `String`,
            required
        }),
        NumberKeyword: () => Effect.succeed({
            type: `Long`,
            required
        }),
        BooleanKeyword: () => Effect.succeed({
            type: `Boolean`,
            required
        }),
        TypeLiteral: (ast) => compilePropSignatures([...ast.propertySignatures]).pipe(Effect.map((attributes) => ({ type: `Record`, attributes }))),
        TupleType: (ast) => {
            return compileAttributeType(ast.rest[0].type, required).pipe(Effect.map(({ required, ...element }) => ({ type: `Set`, element })));
        },
        Transformation: (ast) => {
            if (ast.from._tag === `TupleType`) {
                return compileAttributeType(ast.from.rest[0].type, required).pipe(Effect.map(({ required, ...element }) => ({ type: `Set`, element })));
            }
            return compileEntityClass(ast).pipe(Effect.map(({ name }) => ({ type: `Entity`, name, required })));
        },
        Union: (ast) => {
            if (ast.types.filter((type) => type._tag === `UndefinedKeyword`).length === 1) {
                return compileAttributeType(ast.types[0], required);
            }
            return Effect.fail(new UnsupportedSchema({ ast }));
        }
    }), Match.orElse((ast) => Effect.fail(new UnsupportedSchema({ ast }))))(ast);
    return yield* maybeUseCommonType(compileType);
});
export const normalizePropType = (ast) => {
    switch (ast._tag) {
        case `PropertySignatureDeclaration`:
            return ast.type;
        case `PropertySignatureTransformation`:
            return ast.to.type;
        default:
            return ast;
    }
};
export const compileEntityClass = (ast) => Effect.gen(function* () {
    const id = yield* AST.getIdentifierAnnotation(ast.to).pipe(Effect.orElse(() => Effect.fail(new UnsupportedSchema({ ast, message: `Entity class must have an identifier` }))));
    const { from } = ast;
    if (from._tag !== `TypeLiteral`) {
        return yield* new UnsupportedSchema({ ast: from, message: `Entity compilation failed: entity is not TaggedClass` });
    }
    const cedarSchema = yield* CedarSchema;
    const namespace = yield* getCedarNamespace(ast.to);
    const namespaceMap = cedarSchema.namespace.get(namespace)
        ?? cedarSchema.namespace.set(namespace, { actions: new Map(), commonTypes: new Map(), entityTypes: new Map() }).get(namespace);
    const compile = Effect.gen(function* () {
        const membersOf = yield* Effect.fromNullable(from.propertySignatures.find((prop) => {
            return prop.name === `parents` && prop.type._tag !== `UndefinedKeyword`;
        })?.type)
            .pipe(Effect.flatMap(astMatcher.pipe(Match.tags({
            Union: (unionAst) => {
                const tuple = unionAst.types.filter((type) => type._tag !== `UndefinedKeyword`);
                if (tuple.length === 0) {
                    return Effect.succeed([]);
                }
                return Effect.all(tuple[0].rest.map(({ type }) => astMatcher.pipe(Match.tags({
                    Union: (ast) => Effect.all(ast.types.map(compileEntity))
                }), Match.orElse(compileEntity))(type)));
            }
        }), Match.orElse((ast) => Effect.fail(new UnsupportedSchema({ ast, message: `Can't compile membersOf for ${namespace}::${id}` }))))), Effect.catchTag(`NoSuchElementException`, () => Effect.void));
        return yield* compilePropSignatures(from.propertySignatures.filter((prop) => prop.name !== `parents` && prop.name !== `_tag` && prop.name !== `id`)).pipe(Effect.map((attributes) => ({
            ...(membersOf ? { memberOfTypes: [membersOf].flat(2).map(({ name }) => name) } : {}),
            shape: {
                type: `Record`,
                attributes
            }
        })));
    });
    const entity = yield* Effect.fromNullable(namespaceMap.entityTypes.get(id))
        .pipe(Effect.catchTag(`NoSuchElementException`, () => {
        return compile
            .pipe(Effect.tapError(Console.error), Effect.tap((entity) => Effect.sync(() => namespaceMap.entityTypes.set(id, entity))));
    }));
    return {
        name: [namespace, id].join(`::`),
        entity
    };
});
export const compileEntity = astMatcher.pipe(Match.tags({
    Transformation: (ast) => compileEntityClass(ast),
}), Match.orElse((ast) => Effect.fail(new UnsupportedSchema({ ast }))));
export const compileAction = (A) => Effect.gen(function* () {
    const { principal, resource, context } = A.fields;
    const cedarSchema = yield* CedarSchema;
    const id = yield* pipe(A.ast._tag === `Transformation`
        ? AST.getIdentifierAnnotation(A.ast.to)
        : Option.none(), Effect.orElseFail(() => new UnsupportedSchema({ ast: A.ast, message: `Action must have an identifier` })));
    /**
     * In Action schema fields, principals and resources are single-element tuples
     * where element could be either Entity or union of Entities
     */
    const compileEntities = (prop) => pipe(normalizePropType(prop), astMatcher.pipe(Match.tags({
        Union: (ast) => Effect.all(ast.types.filter((ast) => !isUndefinedKeyword(ast)).map(compileEntity)),
        Transformation: (ast) => compileEntityClass(ast),
        TupleType: (ast) => {
            return astMatcher.pipe(Match.tags({
                Transformation: (ast) => compileEntityClass(ast),
                Union: (ast) => {
                    return Effect.all(ast.types.map(compileEntity));
                },
            }), Match.orElse((ast) => Effect.fail(new UnsupportedSchema({ ast }))))(ast.rest[0].type);
        }
    }), Match.orElse((ast) => Effect.fail(new UnsupportedSchema({ ast })))));
    const principalsCompiled = yield* compileEntities(principal.ast);
    const resourcesCompiled = yield* compileEntities(resource.ast);
    const contextCompiled = yield* context
        ? pipe(normalizePropType(context.ast), compileAttributeType)
        : Effect.succeed(undefined);
    const action = {
        appliesTo: {
            principalTypes: [principalsCompiled].flat().map(({ name }) => name),
            resourceTypes: [resourcesCompiled].flat().map(({ name }) => name),
            context: contextCompiled
        }
    };
    const namespaceMap = cedarSchema.namespace.get(cedarSchema.defaultNamespace)
        ?? cedarSchema.namespace.set(cedarSchema.defaultNamespace, { actions: new Map(), commonTypes: new Map(), entityTypes: new Map() }).get(cedarSchema.defaultNamespace);
    namespaceMap.actions.set(id, action);
});
export const compileFromActions = (actions) => Effect.gen(function* () {
    yield* Effect.forEach(actions, (A) => compileAction(A));
    const { namespace } = yield* CedarSchema;
    return Object.fromEntries([...namespace.entries()].map(([key, value]) => [
        key,
        {
            commonTypes: Object.fromEntries(value.commonTypes.entries()),
            entityTypes: Object.fromEntries(value.entityTypes.entries()),
            actions: Object.fromEntries(value.actions.entries())
        }
    ]));
});
