import type { SettingGroups } from "../types";
import { chatIndicatorSettings } from "./chatIndicator";
import { chatLogViewSettings } from "./chatLogView";
import { filteredChatViewSettings } from "./filteredChatView";


export const settingDefinitions = {
    chatLogView: chatLogViewSettings,
    chatIndicator: chatIndicatorSettings,
    filteredChatView: filteredChatViewSettings,
} as const satisfies Record<string, SettingGroups>;

export type SettingDefinitionId = keyof typeof settingDefinitions;

export const SETTING_DEFINITION_IDS = Object.keys(settingDefinitions) as Readonly<SettingDefinitionId[]>;
