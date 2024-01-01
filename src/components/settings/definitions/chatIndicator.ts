import type { SettingGroups } from "../types";

export const chatIndicatorSettings = {
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
            unit: ' ms'
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
            ],
            isRadio: true,
        },
        width: {
            type: 'range',
            default: 100,
            min: 1,
            max: 100,
            step: 1,
            unit: '%'
        }
    },
} satisfies SettingGroups;