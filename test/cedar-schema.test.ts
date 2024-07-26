import { Console, Effect } from 'effect'
import { compileFromActions } from '../src/index.ts'
import { it } from '@effect/vitest'
import { CedarSchema } from '../src/services.ts'
import * as actions from './fixtures/actions.ts'

it.effect('compiles BookStore schema', () => Effect.gen(function* () {
  // new ViewPost({}, { disableValidation })
  const schema = yield* compileFromActions([
    actions.CancelOrder,
    actions.PlaceOrder
  ]).pipe(
    Effect.tapErrorTag(`UnsupportedSchema`, (err) => 
      Console.error(err.toJSON())
    )
  )

  console.log(JSON.stringify(schema, null, 2))

}).pipe(
  Effect.provideService(CedarSchema, { defaultNamespace: `BookStore`, namespace: new Map() })
))