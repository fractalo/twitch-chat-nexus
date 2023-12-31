export type SafeAny = {
    [key: PropertyKey]: SafeAny,
} | undefined | null;
