export const percentToDecimal = (percent: string, fallback = 0) => {
    const parsed = parseFloat(percent);

    if (!Number.isNaN(parsed)) {
        return parsed / 100;
    } else {
        return fallback;
    }
};