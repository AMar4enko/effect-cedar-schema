import { Schema } from "@effect/schema"

export type IdentifiableEntity = { _tag: string, id: string }

export interface SerializedIdentifier {
  entityType: string
  entityId: string
}

export type SerializedType = boolean | number | string | SerializedIdentifier

export type FullSerializedType = SerializedType | SerializedType[] | Record<string, SerializedType>
