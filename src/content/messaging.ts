import { Messaging } from "src/components/Messaging";
import { ScriptIds } from "src/constants/scripts";
import { getSettingValues } from "src/components/settings";


const messaging = new Messaging(ScriptIds.CONTENT);

messaging.on('connect', () => {
    getSettingValues()
    .then((settingValues) => {
        messaging.postMessage({ type: "SETTINGS", content: settingValues });
    });
});


// from injected scripts
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
        case 'GET_LANGUAGE': {
            messaging.postMessage({ type: 'LANGUAGE', content: chrome.i18n.getUILanguage() });
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

export default messaging;