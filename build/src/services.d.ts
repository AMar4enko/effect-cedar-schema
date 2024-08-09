export interface CedarSchema {
    readonly defaultNamespace: string;
    readonly namespace: Map<string, {
        entityTypes: Map<string, Record<string, any>>;
        commonTypes: Map<string, Record<string, any>>;
        actions: Map<string, Record<string, any>>;
    }>;
}
export declare const CedarSchema: import("effect/Context").Tag<CedarSchema, CedarSchema>;
