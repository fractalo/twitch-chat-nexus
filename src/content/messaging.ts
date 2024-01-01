import { Messaging, SCRIPT_IDS } from "src/messaging";
import { getSettingValues, getAllSettingValues } from "src/components/settings/utils";
import { getAllChatFilterGroupsRuntime } from "src/components/chatFilter/utils";


const messaging = new Messaging(SCRIPT_IDS.CONTENT);

messaging.on('message', async(message) => {
    switch (message.type) {
        case 'GET_SETTINGS': {
            const settingValueGroups = await getSettingValues(message.content);
            messaging.postMessage({ type: "SETTINGS", content: { [message.content]: settingValueGroups } });
            break;
        }
        case 'GET_ALL_SETTINGS': {
            const settingValueGroupsRecord = await getAllSettingValues();
            messaging.postMessage({
                type: "SETTINGS",
                content: settingValueGroupsRecord,
                to: message.from,
                contextId: message.contextId
            });
            break;
        }
        case 'GET_ALL_CHAT_FILTER_GROUPS': {
            const chatFilterGroupsRuntime = await getAllChatFilterGroupsRuntime();
            messaging.postMessage({
                type: "CHAT_FILTER_GROUPS",
                content: chatFilterGroupsRuntime,
                to: message.from,
                contextId: message.contextId
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
        case 'GET_RUNTIME_URL': {
            messaging.postMessage({
                type: "RUNTIME_URL",
                content: chrome.runtime.getURL(message.content),
                to: message.from,
                contextId: message.contextId
            });
            break;
        }
        case 'OPEN_OPTIONS_PAGE': {
            chrome.runtime.sendMessage('OPEN_OPTIONS_PAGE');
            break;
        }
        case 'GET_APP_VERSION': {
            messaging.postMessage({
                type: "APP_VERSION",
                content: chrome.runtime.getManifest().version,
                to: message.from,
                contextId: message.contextId
            });
            break;
        }
        default:
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (sender.id !== chrome.runtime.id) {
        return;
    }
    switch (message.type) {
        default:
    }
});

export default messaging;