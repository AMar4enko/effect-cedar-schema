import * as Schema from 'effect/Schema'
import { Entity } from '../../src/entity'
import NS from './namespace'
import { CedarNamespace } from '../../src/annotations'

const Stock = Schema.Struct({
  reserved: Schema.Number,
  available: Schema.Number
}).pipe(
  Schema.annotations({ identifier: `Stock`, [CedarNamespace]: NS }),
)

class Author extends Entity<Author>()(
  `Author`,
  {
    fields: {
      name: Schema.String
    }
  },
  NS
) {}

class Storage extends Entity<Storage>()(
  `Storage`,
  {
    fields: {
      location: Schema.String
    }
  },
  NS
) {}

class Book extends Entity<Book>()(
  `Book`,
  {
    fields: {
      title: Schema.String,
      author: Author,
      ageFrom: Schema.Number
    }
  },
  NS
) {}

class Department extends Entity<Department>()(
  `Department`,
  {
    fields: {}
  },
  NS
) {}

class Role extends Entity<Role>()(
  `Role`,
  {
    fields: {
      name: Schema.String
    }
  },
  NS
) {}


class User extends Entity<User>()(
  `User`,
  {
    fields: {
      name: Schema.String,
    },
    membersOf: [Role, Department]
  },
  NS
) {}

class Order extends Entity<Order>()(
  `Order`,
  {
    fields: {
      books: Schema.Array(Book),
      stock: Stock,
      storage: Storage,
      manager: User
    }
  },
  NS
) {}

export {
  Author,
  Book,
  Department,
  Order,
  Role,
  Stock,
  Storage,
  User
}