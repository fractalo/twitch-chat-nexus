import type { SettingGroups } from "../types";

export const filteredChatViewSettings = {
    general: {
        isEnabled: {
            type: 'toggle',
            default: false
        }
    },
    behavior: {
        useAutoResize: {
            type: 'toggle',
            default: true
        },
        collapseAfter: {
            type: 'range',
            default: 180,
            min: 10,
            max: 600,
            step: 10,
        },
        maxChatMessages: {
            type: 'range',
            default: 100,
            min: 50,
            max: 1000,
            step: 50
        },
    },
    appearance: {
        location: {
            type: 'select',
            default: 'top',
            options: [
                'top',
                'bottom',
            ],
            isRadio: true,
        },
        timestampFormat: {
            type: 'select',
            default: 'hidden' as TimestampFormat,
            options: [
                'hidden',
                '12h',
                '24h',
            ],
            isRadio: true,
        },
    },
} satisfies SettingGroups;

export type TimestampFormat = 'hidden' | '12h' | '24h';

