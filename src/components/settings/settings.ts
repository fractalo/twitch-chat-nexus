import type { MainCategorySettingValues, MainCategorySettings, Setting, SettingValue } from "./types";

export const settingDefinitions: MainCategorySettings = {
    chatLogView: {
        openingButton: {
            location: {
                type: 'select',
                default: "bottomOfChatWindow",
                options: [
                    "bottomOfChatWindow",
                    "chatSettingsMenu"
                ]
            },
            windowType: {
                type: 'select',
                default: "popup",
                options: [
                    "popup",
                    "tab"
                ]
            },
            alwaysNewWindow: {
                type: 'toggle',
                default: false
            }
        }
    },
    chatIndicator: {
        behavior: {
            showWaiting: {
                type: 'toggle',
                default: false
            },
            showSuccess: {
                type: 'toggle',
                default: true
            },
            showTimeout: {
                type: 'toggle',
                default: true
            },
            hideAfter: {
                type: 'range',
                default: 3000,
                min: 500,
                max: 5000,
                step: 100,
                unit: 'ms'
            }
        },
        appearance: {
            thickness: {
                type: 'select',
                default: "normal",
                options: [
                    "light",
                    "normal",
                    "bold"
                ]
            },
            width: {
                type: 'select',
                default: "100%",
                options: [
                    "10%",
                    "20%",
                    "30%",
                    "50%",
                    "75%",
                    "100%"
                ]
            }
        },
    }
};


export const getSettingsI18nMessage = (path: string[]) => {
    return chrome.i18n.getMessage(['settings', ...path].join('_'));
};

const isSettingValueValid = (settingValue: SettingValue, setting: Setting) => {
    switch (setting.type) {
        case 'toggle': {
            if (typeof settingValue === 'boolean') {
                return true;
            }
            break;
        }
        case 'select': {
            if (typeof settingValue === 'string') {
                return setting.options.includes(settingValue);
            }
            break;
        }
        case 'range': {
            if (typeof settingValue === 'number') {
                return settingValue >= setting.min && settingValue <= setting.max;
            }
            break;
        }
        default:
    }

    return false;
};


export const getSettingValues = async() => {
    const items = await chrome.storage.local.get("settings");
    const storedSettingValues: MainCategorySettingValues = items.settings || {};

    const settingValues: MainCategorySettingValues = {};

    Object.entries(settingDefinitions).forEach(([mainCategory, subCategorySettings]) => {
        settingValues[mainCategory] = {};
        Object.entries(subCategorySettings).forEach(([subCategory, actualSettings]) => {
            settingValues[mainCategory][subCategory] = {};
            Object.entries(actualSettings).forEach(([name, setting]) => {
                const storedSettingValue = storedSettingValues?.[mainCategory]?.[subCategory]?.[name];
                if (isSettingValueValid(storedSettingValue, setting)) {
                    settingValues[mainCategory][subCategory][name] = storedSettingValue;
                } else {
                    settingValues[mainCategory][subCategory][name] = setting.default;
                }
            });
        });
    });

    return settingValues;
};
