import { Action } from '../../src/action.js'
import NS from './namespace.js'
import { Author, Order, User } from './entities.js'
import { Schema } from '@effect/schema'

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
    resources: [Order],
    context: {
      reason: Schema.String,
      author: Author
    }
  },
  NS
) {}

export { PlaceOrder, CancelOrder }