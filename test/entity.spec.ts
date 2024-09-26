import { expect, test } from 'vitest'
import { Author, Book } from './fixtures/entities'
import { Effect, Hash } from 'effect'
import { getEntities, makeSerialisedEntity } from '../src'

test('should be able to serialize', () => {
  const eff = new Book({ title: `My precious book`, id: `123`, ageFrom: 10, author: new Author({ id: `1`, name: `John` }) }).serialize()
    .pipe(
      Effect.bindTo(`value`),
      Effect.bind(`entities`, () => getEntities),
    )

  expect(Effect.runSync(eff)).toMatchSnapshot()
})


test(`Hash`, () => {
  const a = makeSerialisedEntity(
    {
      entityType: `User`,
      entityId: `1`
    },
    {}
  )


  expect(Hash.hash(a)).toBe(Hash.hash(`User1`))
})