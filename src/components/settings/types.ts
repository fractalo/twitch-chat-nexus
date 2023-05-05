export interface ToggleSetting {
    type: "toggle";
    default: boolean;
}

export interface SelectSetting {
    type: "select"
    default: string;
    options: string[];
}

export interface RangeSetting {
    type: "range";
    default: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
}

export type Setting = ToggleSetting | SelectSetting | RangeSetting;
type Settings = Record<string, Setting>;
type SubCategorySettings = Record<string, Settings>;
export type MainCategorySettings = Record<string, SubCategorySettings>;


export type SettingValue = Setting["default"];

export type SettingValues = Record<string, SettingValue>;
export type SubCategorySettingValues = Record<string, SettingValues>;
export type MainCategorySettingValues = Record<string, SubCategorySettingValues>;

