import type { SafeAny } from "./SafeAny";

export const getChromeLocalStorageItem = async(key: string): Promise<SafeAny> => {
    const items = await chrome.storage.local.get(key);
    return items[key];
};

export const setChromeLocalStorageItem = async<T>(key: string, value: T) => {
    await chrome.storage.local.set({ [key]: value });
};

export const removeChromeLocalStorageItems = (keys: string[]) => {
    chrome.storage.local.remove(keys);
};
