import { describe, expect, it } from 'vitest'
import { CancelOrder, PlaceOrder } from './fixtures/actions.js'
import * as ent from './fixtures/entities.js'
import { Effect, Hash } from 'effect'
import { getEntities, makeSerialisedEntity } from '../src/entity.js'
import { equals } from 'effect/Equal'

describe(`Action`, () => {
  it(`should serialize`, () => {
    const managerRole = new ent.Role({
      id: `managers`,
      name: `Managers`
    })

    const manager = new ent.User({
      id: `1`,
      name: `user`,
      parents: [
        managerRole
      ]
    })

    const order = new ent.Order({
      id: `2`,
      manager,
      stock: {
        available: 10,
        reserved: 0
      },
      storage: new ent.Storage({
        id: `1`,
        location: `storage`
      }),
      books: [
        new ent.Book({
          id: `1`,
          title: `book`,
          ageFrom: 10,
          author: new ent.Author({
            id: `1`,
            name: `author`
          }),
        })
      ]
    })

      
    const placeOrder = new PlaceOrder({
      resource: order
    })

    const cancelOrder = new CancelOrder({
      principal: manager,
      resource: order,
      context: {
        reason: `Cancelled by customer`
      }
    })

    const actions = Effect.all([placeOrder.serialize(), cancelOrder.serialize()])

    const serialize = actions.pipe(
      Effect.bindTo(`actions`),
      Effect.bind(`entities`, () => getEntities)  
    )
    
    const result = Effect.runSync(serialize)

    expect(result).toMatchSnapshot()
  })
})