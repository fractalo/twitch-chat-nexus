import type { SettingGroups } from "../types";

export const chatLogViewSettings = {
    openingButton: {
        location: {
            type: 'select',
            default: "bottomOfChatWindow",
            options: [
                "bottomOfChatWindow",
                "chatSettingsMenu"
            ],
        },
        windowType: {
            type: 'select',
            default: "popup",
            options: [
                "popup",
                "tab"
            ],
            isRadio: true,
        },
        alwaysNewWindow: {
            type: 'toggle',
            default: false
        },
        popupSize: {
            type: 'select',
            default: 100,
            options: [ 75, 80, 90, 100, 110, 125, 150, 175, 200 ],
            suffix: '%'
        }
    }
} satisfies SettingGroups;