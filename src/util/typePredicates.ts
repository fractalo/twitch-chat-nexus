export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && !Array.isArray(value) && value !== null;
};

export const isObjectOwnKey = <T extends object>(obj: T, key: PropertyKey): key is keyof T => {
    return Object.hasOwn(obj, key);
};

export const isNonNullableArray = <T>(array: T[]): array is NonNullable<T>[] => {
    return array.every(item => item);
};

export const isNonNullableTuple = <T extends any[]>(tuple: T): tuple is { [K in keyof T]: NonNullable<T[K]> } => {
    return tuple.every(item => item);
};

export const isUnknownArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
};

export const includesString = <T extends string>(array: ReadonlyArray<T>, str: string): str is T => {
    return array.some(el => el === str);
};