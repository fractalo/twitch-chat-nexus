export interface ToggleSetting {
    type: "toggle";
    default: boolean;
}

type SelectSettingValue = string | number;

interface SelectSettingGeneric<T extends SelectSettingValue> {
    type: "select";
    default: T;
    options: Readonly<T[]>;
    suffix?: string;
    isRadio?: boolean;
}

type SelectSettingMap = {
    [T in SelectSettingValue]: SelectSettingGeneric<T>;
};

export type SelectSetting = SelectSettingMap[keyof SelectSettingMap];

export interface RangeSetting {
    type: "range";
    default: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
}

export type Setting = ToggleSetting | SelectSetting | RangeSetting;
export type SettingGroup = Record<string, Setting>;
export type SettingGroups = Record<string, SettingGroup>;

export type SettingValue = Setting["default"];
export type SettingValueGroup = Record<string, SettingValue>;
export type SettingValueGroups = Record<string, SettingValueGroup>;

export interface SettingValueEvent {
    category: string;
    name: string;
    settingValue: SettingValue;
}

export type SettingValueGroupsRecord = Record<string, SettingValueGroups>;