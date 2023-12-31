import type { SafeRange } from "./SafeRange";
import { isRecord, isUnknownArray } from "./typePredicates";

export const toTimestampSafe = (value: unknown): number | undefined => {
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
        const timestamp = new Date(value).getTime();
        return Number.isNaN(timestamp) ? undefined : timestamp;
    }
};

export const toStringSafe = (value: unknown): string | undefined => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
};

export const toRecordSafe = (value: unknown): Record<string, unknown> | undefined => {
    if (isRecord(value)) {
        return value;
    }
};
