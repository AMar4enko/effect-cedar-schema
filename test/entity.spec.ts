import { expect, test } from 'vitest'
import { Author, Book } from './fixtures/entities'
import { Effect } from 'effect'
import { getEntities } from '../src'

test('should be able to serialize', () => {
  const eff = new Book({ title: `My precious book`, id: `123`, ageFrom: 10, author: new Author({ id: `1`, name: `John` }) }).serialize()
    .pipe(
      Effect.bindTo(`value`),
      Effect.bind(`entities`, () => getEntities),
    )

  expect(Effect.runSync(eff)).toMatchObject({
    value: {
      entityType: `BookStore::Book`,
      entityId: `123`
    },
    entities: [
      {
        identifier: {
          entityType: `BookStore::Author`,
          entityId: `1`
        },
        attributes: {
          name: `John`
        }
      },
      {
        identifier: {
          entityType: `BookStore::Book`,
          entityId: `123`
        },
        attributes: {
          title: `My precious book`,
          ageFrom: 10,
          author: {
            entityType: `BookStore::Author`,
            entityId: `1`
          }
        }
      }
    ]
  })
})

