import { includesString, isRecord } from "src/util/typePredicates";
import type { OutputOptions, TimestampFormat } from "./types";

const STORAGE_KEY_PREFIX = 'tcn_filtered_chat_share_';

const TIMESTAMP_FORMAT_STORAGE_KEY = STORAGE_KEY_PREFIX + 'timestamp_format';

const DEFAULT_TIMESTAMP_FORMAT: TimestampFormat = 'hidden';

const IMAGE_WIDTH_PIXEL_STORAGE_KEY = STORAGE_KEY_PREFIX + 'image_width_pixel';

export const DEFAULT_IMAGE_WIDTH_PIXEL: number = 340;

const IMAGE_PIXEL_RATIO_STORAGE_KEY = STORAGE_KEY_PREFIX + 'image_pixel_ratio';

const DEFAULT_IMAGE_PIXEL_RATIO: number = 1.0;


export const TIMESTAMP_FORMATS: TimestampFormat[] = ['hidden', '12-hour', '24-hour'];

export const PIXEL_RATIOS: number[] = [ 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];

export const getStoredTimestampFormat = (): TimestampFormat => {
    const value = localStorage.getItem(TIMESTAMP_FORMAT_STORAGE_KEY);
    if (!value || !includesString(TIMESTAMP_FORMATS, value)) {
        return DEFAULT_TIMESTAMP_FORMAT;
    }
    return value;
};

export const storeTimestampFormat = (timestampFormat: TimestampFormat) => {
    localStorage.setItem(TIMESTAMP_FORMAT_STORAGE_KEY, timestampFormat);
};

export const getValidImageWidthPixel = (value: unknown, fallback: number) => {
    const width = Math.floor(Number(value));
    if (isNaN(width) || width < 10) {
        return fallback;
    }
    return width;
};

export const getStoredImageWidthPixel = (): number => {
    const value = localStorage.getItem(IMAGE_WIDTH_PIXEL_STORAGE_KEY);
    if (!value) {
        return DEFAULT_IMAGE_WIDTH_PIXEL;
    }
    return getValidImageWidthPixel(value, DEFAULT_IMAGE_WIDTH_PIXEL);
};

export const storeImageWidthPixel = (imageWidthPixel: number) => {
    localStorage.setItem(IMAGE_WIDTH_PIXEL_STORAGE_KEY, imageWidthPixel.toString());
};

export const getStoredImagePixelRatio = (): number => {
    const value = localStorage.getItem(IMAGE_PIXEL_RATIO_STORAGE_KEY);
    if (!value) {
        return DEFAULT_IMAGE_PIXEL_RATIO;
    }

    try {
        const ratio = parseFloat(value);
        if (Number.isNaN(ratio) || !PIXEL_RATIOS.includes(ratio)) {
            throw new Error();
        }
        return ratio;
    } catch (error) {
        return DEFAULT_IMAGE_PIXEL_RATIO;
    }
};

export const storeImagePixelRatio = (imagePixelRatio: number) => {
    localStorage.setItem(IMAGE_PIXEL_RATIO_STORAGE_KEY, imagePixelRatio.toString());
};