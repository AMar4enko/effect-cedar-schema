import { Console, Effect } from 'effect'
import { compileFromActions } from '../src/index.ts'
import { expect, it } from '@effect/vitest'
import { CedarSchema } from '../src/services.ts'
import * as actions from './fixtures/actions.ts'

it.effect('compiles BookStore schema', () => Effect.gen(function* () {
  const schema = yield* compileFromActions([
    actions.CancelOrder,
    actions.PlaceOrder
  ]).pipe(
    Effect.tapErrorTag(`UnsupportedSchema`, (err) => 
      Console.error(err.toJSON())
    )
  )

  expect(schema).toMatchSnapshot()

}).pipe(
  Effect.provideService(CedarSchema, { defaultNamespace: `BookStore`, namespace: new Map() })
))