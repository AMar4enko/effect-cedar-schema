import { GenericTag } from "effect/Context"

export interface CedarSchema {
  readonly defaultNamespace: string
  readonly namespace: Map<string, {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    entityTypes: Map<string, Record<string, any>>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    commonTypes: Map<string, Record<string, any>>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    actions: Map<string, Record<string, any>>  
  }>
}

export const CedarSchema = GenericTag<CedarSchema>(`@cedar-schema/schema`)
