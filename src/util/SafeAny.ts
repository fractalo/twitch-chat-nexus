export type SafeAny = {
    [key: PropertyKey]: SafeAny,
} | undefined | null;

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
}