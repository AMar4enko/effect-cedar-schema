import { Effect, Console } from 'effect'
import { Schema, Serializable } from '@effect/schema'
import { compileAttributeType, compileFromActions } from '../src/index.ts'
import { expect, it } from '@effect/vitest'
import { Entity } from '../src/entity'
import { Action, ActionWithContext, serializeAction } from '../src/action'
import { CedarSchema } from '../src/services.ts'

const NS = `CustomerPortal`

class Group extends Entity<Group>()(
  `Group`,
  {
    fields: {
      name: Schema.String
    }
  },
  NS
) {}

class Department extends Entity<Department>()(
  `Department`,
  {
    fields: {},
    membersOf: [Group]
  },
  NS
) {}

class User extends Entity<User>()(
  `User`,
  {
    fields: {
      id: Schema.String,
    },
    membersOf: [Group, Department]
  },
  NS
) {}

class Post extends Entity<Post>()(
  `Post`,
  { 
    fields: {}
  },
  NS
) {}


class ViewPost extends Action<ViewPost>()(
  `viewPost`,
  {
    principals: [User],
    resources: [Post]
  },
  NS
) {}

class EditPost extends ActionWithContext<EditPost>()(
  `editPost`,
  {
    principals: [User],
    resources: [Post],
    context: Schema.Struct({ authLevel: Schema.Number })
  },
  NS
) {}


const u = new User({ 
  id: `123`,
  parents: [
    new Group({ id: `Admin`, name: `Admin` }),
    new Department({ id: `Accounting` }),
  ]
})

const action1 = new ViewPost({ principal: u, resource: new Post({ id: `123` }) })
const action2 = new EditPost({ principal: u, resource: new Post({ id: `234` }), context: { authLevel: 1 } })



it.effect('makes sense', () => Effect.gen(function* () {
  // new ViewPost({}, { disableValidation })
  const schema = yield* compileFromActions(ViewPost, EditPost).pipe(
    Effect.tapError(Console.error),
  )

  // console.log(yield* Serializable.serialize(action2))
  console.log(JSON.stringify(yield* serializeAction(action2), null, 2))

  // console.log(JSON.stringify(schema, null, 2))

}).pipe(
  Effect.provideService(CedarSchema, { defaultNamespace: `CustomerPortal`, namespace: new Map() })
)

)


it.skip('compileAttributeType', () => Effect.gen(function* (){
  const s = Schema.String
  const n = Schema.Number
  const b = Schema.Boolean

  const struct = Schema.Struct({
    a: s,
    b: n,
    c: b,
    // d: Schema.Array(s)
  })

  expect(
    yield* compileAttributeType(s.ast)
  ).toEqual({
    type: `String`
  })

  expect(
    yield* compileAttributeType(n.ast)
  ).toEqual({
    type: `Long`
  })

  expect(
    yield* compileAttributeType(b.ast)
  ).toEqual({
    type: `Boolean`
  })

  expect(
    yield* compileAttributeType(struct.ast)
  ).toEqual({
    type: `Record`,
    attributes: {
      a: {
        type: `String`
      },
      b: {
        type: `Long`
      },
      c: {
        type: `Boolean`
      }
    }
  })

  compileFromActions(ViewPost, EditPost)

  // expect(
  //   yield* compileAttributeType(Schema.Array(s).ast)
  // ).toEqual({
  //   type: `Array`,
  //   attributes: {
  //     items: {
  //       type: `String`
  //     }
  //   }
  // })
  // )


}).pipe(
  Effect.provideService(CedarSchema, { defaultNamespace: `CustomerPortal`, namespace: new Map() }),
))