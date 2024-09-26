export type IdentifiableEntity = { _tag: string, id: string }

export interface SerializedIdentifier {
  entityType: string
  entityId: string
}

export type SerializedType = 
  | { boolean: boolean }
  | { long: number }
  | { string: string }
  | { record: Record<string, SerializedType> }
  | { set: SerializedType[] }
  | { entityIdentifier: SerializedIdentifier }

export type SerializedAttributes = Record<string, SerializedType>