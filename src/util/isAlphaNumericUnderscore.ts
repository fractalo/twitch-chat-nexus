export const isAlphaNumericUnderscore = (str: string | null | undefined): boolean => {
    if (!str) return false;
    return /^[a-zA-Z0-9_]+$/.test(str);
};