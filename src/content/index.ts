// https://dev.to/jacksteamdev/advanced-config-for-rpce-3966

import { Messaging } from "src/components/Messaging";
import { ScriptIds } from "src/constants/scripts";
import styles from './styles.css?inline';
import { injectInlineStyle } from "src/util/injectors";
import { getSettingValues, type MainCategorySettingValues } from "src/components/settings";

injectInlineStyle(styles);


const messaging = new Messaging(ScriptIds.content);

messaging.on('connect', () => {
    getSettingValues()
    .then((settingValues) => {
        messaging.postMessage({ type: "SETTINGS", content: settingValues });
    });
});

// from injected script
messaging.on('message', (message) => {
    switch (message.type) {
        case 'GET_SETTINGS': {
            getSettingValues()
            .then((settingValues) => {
                messaging.postMessage({ type: "SETTINGS", content: settingValues });
            });
            break;
        }
        case 'GET_I18N_MESSAGES': {
            if (Array.isArray(message.content)) {
                const i18nMessages = message.content.reduce((result, key) => {
                    result[key] = chrome.i18n.getMessage(key);
                    return result;
                }, {});
                messaging.postMessage({
                    type: "I18N_MESSAGES",
                    content: i18nMessages,
                    to: message.from,
                    contextId: message.contextId
                });
            }
            break;
        }
        default:
    }
});

// from background
chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id) {
        return;
    }
    switch (message.type) {
        default:
    }
});

chrome.storage.local.onChanged.addListener((changes) => {
    const newSettingValues = changes.settings?.newValue as MainCategorySettingValues | undefined;
    if (!newSettingValues) return;

    messaging.postMessage({ type: "SETTINGS", content: newSettingValues });
});

