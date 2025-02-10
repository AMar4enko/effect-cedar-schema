import * as Schema from "effect/Schema";
import { TaggedRequest, } from "effect/Schema";
import { Effect } from "effect";
import { CedarNamespace } from "./annotations.js";
import { compile } from "./entity.js";
const ActionTypeId = Symbol(`effect-cedar/ActionTypeId`);
export const DeterminingPolicies = Schema.Array(Schema.Struct({ policyId: Schema.String }));
export const Errors = Schema.Array(Schema.Struct({ errorDescription: Schema.String }));
export const Success = Schema.Struct({
    DeterminingPolicies: DeterminingPolicies,
});
export const Failure = Schema.Struct({
    errors: Errors,
});
export const serializeAction = (ctx) => {
    const serializeContext = ctx ? compile(ctx) : Effect.succeed;
    return (action) => Effect.gen(function* () {
        const res = {};
        if (action.principal) {
            res.principal = yield* action.principal.serialize();
        }
        if (action.context) {
            const { record } = yield* serializeContext(action.context);
            res.context = {
                contextMap: record,
            };
        }
        const resource = yield* action.resource.serialize();
        return {
            ...res,
            action: {
                actionType: [action.namespace, `Action`].join(`::`),
                actionId: action._tag,
            },
            resource,
        };
    });
};
export const Action = () => (tag, args, namespace) => {
    const annotations = namespace ? { [CedarNamespace]: namespace } : undefined;
    const payload = {
        principal: Schema.optional(Schema.Union(...args.principals)),
        resource: Schema.Union(...args.resources),
    };
    const ctx = args.context ? Schema.Struct(args.context) : Schema.Never;
    const _serialize = serializeAction(args.context ? ctx.ast : undefined);
    class Cls extends TaggedRequest(tag)(tag, {
        success: Success,
        failure: Failure,
        payload: args.context
            ? {
                ...payload,
                context: ctx,
            }
            : payload,
    }, annotations) {
        namespace = namespace;
        serialize = () => _serialize(this);
    }
    Object.defineProperty(Cls, "name", { value: tag });
    return Cls;
};
