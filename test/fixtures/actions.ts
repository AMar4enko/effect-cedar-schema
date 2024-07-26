import { Schema } from '@effect/schema'
import { Entity } from '../../src/entity'
import { Action } from '../../src/action'
import NS from './namespace'
import { Order, User } from './entities'

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