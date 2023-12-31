import { isRecord } from "./typePredicates"

export const assignPropertyIfValid = <T>(obj: unknown, property: string, value: T): boolean => {
    if (
        isRecord(obj) &&
        (obj[property] === undefined || obj[property] === null || typeof obj[property] === typeof value)
    ) {
        obj[property] = value;
        return true;
    }
    return false;
};