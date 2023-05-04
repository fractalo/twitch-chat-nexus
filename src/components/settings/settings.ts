interface ToggleSetting {
    default: boolean;
}

interface SelectSetting {
    default: string;
    options: string[];
}

type Setting = ToggleSetting | SelectSetting;
type Settings = Record<string, Setting>;
type SubCategorySettings = Record<string, Settings>;
export type MainCategorySettings = Record<string, SubCategorySettings>;

export type SettingValue = boolean | string;
export type SettingValues = Record<string, SettingValue>;
export type SubCategorySettingValues = Record<string, SettingValues>;
export type MainCategorySettingValues = Record<string, SubCategorySettingValues>;

export const settingDefinitions: MainCategorySettings = {
    chatLogView: {
        openingButton: {
            location: {
                default: "bottomOfChatWindow",
                options: [
                    "bottomOfChatWindow",
                    "chatSettingsMenu"
                ]
            },
            windowType: {
                default: "popup",
                options: [
                    "popup",
                    "tab"
                ]
            },
            alwaysNewWindow: {
                default: false
            }
        }
    },
    chatIndicator: {
        behavior: {
            showWaiting: {
                default: true
            },
            showSuccess: {
                default: true
            },
            showTimeout: {
                default: true
            },
            hideAfter: {
                default: "3000",
                options: [
                    "1000",
                    "2000",
                    "3000",
                    "5000"
                ]
            }
        },
        appearance: {
            thickness: {
                default: "normal",
                options: [
                    "light",
                    "normal",
                    "bold"
                ]
            },
            width: {
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
                if (
                    storedSettingValue !== undefined &&
                    typeof storedSettingValue === typeof setting.default &&
                    (!('options' in setting) || setting.options.includes(storedSettingValue as string))
                ) {
                    settingValues[mainCategory][subCategory][name] = storedSettingValue;
                } else {
                    settingValues[mainCategory][subCategory][name] = setting.default;
                }
            });
        });
    });

    return settingValues;
};
