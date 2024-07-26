import { expect, it } from '@effect/vitest'
import type * as Cedar from '@cedar-policy/cedar-wasm'
import { compileFromActions } from '../src'
import * as actions from './fixtures/actions'
import { Console, Effect } from 'effect'
import { CedarSchema } from '../src/services'

const cedar: typeof Cedar = require('@cedar-policy/cedar-wasm/nodejs')

it.effect('compiles BookStore schema', () => Effect.gen(function* () {
  const schemaString = yield* compileFromActions([
    actions.CancelOrder,
    actions.PlaceOrder
  ]).pipe(
    Effect.map((s) => JSON.stringify(s, null, 2)),
    Effect.tap(Console.log),
    Effect.tapErrorTag(`UnsupportedSchema`, (err) => 
      Console.error(err.toJSON())
    )
  )

  const result = cedar.checkParseSchema(schemaString)
  console.log(result)


}).pipe(
  Effect.provideService(CedarSchema, { defaultNamespace: `BookStore`, namespace: new Map() })
))

// it('works', async () => {
//   // await import('@cedar-policy/cedar-wasm')
//   //   .then(({ getCedarVersion }) => {
//   //     expect(getCedarVersion()).toBe('0.0.1')
//   //   })

//   cedar.checkParseSchema()

//   console.log(await cedar.getCedarVersion())
// })