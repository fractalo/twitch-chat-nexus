const ROOT_SIZE_STORAGE_KEY = 'tcn_filtered_chat_split_size';
export const DEFAULT_ROOT_SIZE_RATIO = 30;

export const getStoredRootSizeRatio = () => {
    const value = localStorage.getItem(ROOT_SIZE_STORAGE_KEY);
    if (!value) {
        return DEFAULT_ROOT_SIZE_RATIO;
    }

    try {
        const ratio = parseFloat(value);
        if (Number.isNaN(ratio) || ratio < 0 || ratio > 100) {
            return DEFAULT_ROOT_SIZE_RATIO;
        }
        return ratio;
    } catch (error) {
        return DEFAULT_ROOT_SIZE_RATIO;
    }
};

export const storeRootSizeRatio = (rootSizeRatio: number) => {
    localStorage.setItem(ROOT_SIZE_STORAGE_KEY, rootSizeRatio.toString());
};