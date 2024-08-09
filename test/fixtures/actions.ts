import { Schema } from '@effect/schema'
import { Entity } from '../../src/entity.js'
import { Action } from '../../src/action.js'
import NS from './namespace.js'
import { Order, User } from './entities.js'

class PlaceOrder extends Action<PlaceOrder>()(
  `placeOrder`,
  {
    principals: [User],
    resources: [Order]
  },
  NS
) {}

class CancelOrder extends Action<CancelOrder>()(
  `cancelOrder`,
  {
    principals: [User],
    resources: [Order]
  },
  NS
) {}

export { PlaceOrder, CancelOrder }