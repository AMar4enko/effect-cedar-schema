import { GenericTag } from "effect/Context"

export interface CedarSchema {
  readonly defaultNamespace: string
  readonly namespace: Map<string, {
    entityTypes: Map<string, Record<string, any>>
    commonTypes: Map<string, Record<string, any>>
    actions: Map<string, Record<string, any>>  
  }>
}

export const CedarSchema = GenericTag<CedarSchema>(`@cedar-schema/schema`)
