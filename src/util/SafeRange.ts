import { isUnknownArray } from "./typePredicates";

/**
 * JSON stringifyable range that can express infinity
 */
export type SafeRange = [from: number | null, to: number | null];

type Range = [from: number, to: number];

export const toRangeString = (safeRange: SafeRange): string => {
    const [from, to] = safeRange;
    return [
        (from === null) ? '' : from,
        (to === null) ? '' : to
    ].join(',');
};

export const fromRangeString = (range: string): SafeRange => {
    const parts = range.split(',');
    
    if (parts.length !== 2) {
        return [null, null];
    }

    const [fromStr, toStr] = parts;
    const from = fromStr ? Number(fromStr) : null;
    const to = toStr ? Number(toStr) : null;

    return [
        Number.isNaN(from) ? null : from,
        Number.isNaN(to) ? null : to
    ];
};

export const toSafeRangeArray = (arr: unknown[]): SafeRange[] => {
    const ranges: SafeRange[] = [];
    const rangeStrings = new Set<string>();

    arr.forEach(value => {
        if (!isUnknownArray(value) || value.length !== 2) return;
        const [ val1, val2 ] = value;
        const num1 = val1 === null ? null : Number(val1);
        const num2 = val2 === null ? null : Number(val2);

        if (
            (num1 !== null && isNaN(num1)) ||
            (num2 !== null && isNaN(num2))
        ) return;

        let range: SafeRange;
        if (num1 !== null && num2 !== null) {
            range = num1 < num2 ? [num1, num2] : [num2, num1];
        } else {
            range = [num1, num2];
        }

        const rangeString = toRangeString(range);
        if (rangeStrings.has(rangeString)) return;
        rangeStrings.add(rangeString);
        ranges.push(range);
    });

    return ranges;
};

const toUnsafeRange = (range: SafeRange): Range => {
    return [
        range[0] === null ? -Infinity : range[0],
        range[1] === null ? Infinity : range[1]
    ];
};

const toSafeRange = (range: Range): SafeRange => {
    return [
        range[0] === -Infinity || range[0] === Infinity ? null : range[0],
        range[1] === -Infinity || range[1] === Infinity ? null : range[1]
    ];
};
  
export const sortRanges = (ranges: SafeRange[]): SafeRange[] => {
    return ranges
        .map(toUnsafeRange)
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map(toSafeRange);
};

export const mergeRanges = (ranges: SafeRange[]): SafeRange[] => {
    const result: Range[] = [];

    ranges
    .map(toUnsafeRange)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .forEach(range => {
        const lastRange = result.length ? result[result.length - 1] : null;

        if (!lastRange || range[0] > lastRange[1]) {
            result.push(range);
        } else if (range[1] > lastRange[1]) {
            result.pop();
            result.push([lastRange[0], range[1]]);
        }
    });

    return result.map(toSafeRange);
};

export const isInRanges = (num: number, ranges: SafeRange[]): boolean => {
    return ranges.some((range) => {
        const [from, to] = toUnsafeRange(range);
        return from <= num && num <= to;
    });
};