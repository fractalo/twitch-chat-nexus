import type { SafeAny } from "src/util/SafeAny";
import { settingDefinitions } from "./definitions";
import type { Setting, SettingGroups, SettingValue, SettingValueGroups, SettingValueGroupsRecord } from "./types";
import { isObjectOwnKey } from "src/util/typePredicates";
import { getChromeLocalStorageItem } from "src/util/storage";


const isValueTypeMatched = <T extends Setting>(value: unknown, setting: T): value is T["default"] => {
    return typeof value === typeof setting.default;
};

const tryConvertToNumber = (value: unknown) => typeof value === 'string' ? parseFloat(value) : value;

const getValidSettingValue = (value: unknown, setting: Setting): SettingValue => {
    switch (setting.type) {
        case 'toggle': {
            if (isValueTypeMatched(value, setting)) {
                return value;
            }
            break;
        }
        case 'select': {
            if (typeof setting.default === 'string') {
                const valueAsString = isValueTypeMatched(value, setting) ? value : String(value);
                if (setting.options.includes(valueAsString)) {
                    return valueAsString;
                }
            } else {
                const convertedValue = tryConvertToNumber(value);
                if (isValueTypeMatched(convertedValue, setting) && setting.options.includes(convertedValue)) {
                    return convertedValue;
                }
            }            
            break;
        }
        case 'range': {
            const convertedValue = tryConvertToNumber(value);
            if (
                isValueTypeMatched(convertedValue, setting) &&
                convertedValue >= setting.min && convertedValue <= setting.max
            ) {
                return convertedValue;
            }
            break;
        }
        default:
    }
    return setting.default;
};

export const SETTINGS_KEY_PREFIX = 'settings';

export const createStorageKey = (id: string) => [SETTINGS_KEY_PREFIX, id].join('.');

const getStoredSettingValues = async(id: string): Promise<SafeAny> => {
    let settingValues = await getChromeLocalStorageItem(createStorageKey(id));
    if (settingValues) {
        return settingValues;
    }

    // get v1 setting values
    settingValues = await getChromeLocalStorageItem(SETTINGS_KEY_PREFIX);
    return settingValues?.[id];
};

export const getSettingValues = async(id: string) => {
    if (!isObjectOwnKey(settingDefinitions, id)) {
        return null;
    }

    const storedSettingValues = await getStoredSettingValues(id);

    const settingValues: SettingValueGroups = {};

    Object.entries(settingDefinitions[id] as SettingGroups).forEach(([category, settingGroup]) => {
        settingValues[category] = {};
        Object.entries(settingGroup).forEach(([name, setting]) => {
            const storedSettingValue = storedSettingValues?.[category]?.[name] as unknown;
            settingValues[category][name] = getValidSettingValue(storedSettingValue, setting);
        });
    });

    return settingValues;
};

export const getAllSettingValues = async() => {
    const definitionIds = Object.keys(settingDefinitions);

    const allSettingValues: SettingValueGroupsRecord = {};

    await Promise.all(
        definitionIds.map(async(id) => {
            const settingValueGroups = await getSettingValues(id);
            if (settingValueGroups) {
                allSettingValues[id] = settingValueGroups;
            }
        })
    );

    return allSettingValues;
};

export const setSettingValues = (id: string, values: SettingValueGroups) => {
    const key = createStorageKey(id);
    chrome.storage.local.set({ [key]: values });
};

