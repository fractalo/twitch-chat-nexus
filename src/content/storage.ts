import messaging from './messaging';
import { SETTING_DEFINITION_IDS } from 'src/components/settings/definitions';
import type { SettingValueGroupsRecord } from 'src/components/settings/types';
import type { ChatFilterGroupsRuntime } from 'src/components/chatFilter/types';
import { CHAT_FILTERS_KEY_PREFIX, CHAT_FILTER_GROUPS_KEY, CHAT_FILTER_TYPES, updateChatFilterGroupsRuntimeCache, updateChatFilterListsRuntimeCache, mergeChatFiltersToGroup } from 'src/components/chatFilter/utils';
import { SETTINGS_KEY_PREFIX } from 'src/components/settings/utils';
import { includesString } from 'src/util/typePredicates';

/** post updated setting values and chat filters */
chrome.storage.local.onChanged.addListener((changes) => {
    const settingValueGroupsRecord: SettingValueGroupsRecord = {};
    const chatFilterListsRuntimePatch: ChatFilterGroupsRuntime = {};

    Object.entries(changes).forEach(([key, { newValue }]) => {
        if (!newValue) return;

        const keySegments = key.split('.');

        if (
            keySegments.length === 2 &&
            keySegments[0] === SETTINGS_KEY_PREFIX &&
            includesString(SETTING_DEFINITION_IDS, keySegments[1])
        ) {
            settingValueGroupsRecord[keySegments[1]] = newValue;
            return;
        }
        
        if (
            keySegments.length === 3 &&
            keySegments[0] === CHAT_FILTERS_KEY_PREFIX &&
            includesString(CHAT_FILTER_TYPES, keySegments[2])
        ) {
            const { excludeFilters, includeFilters } = updateChatFilterListsRuntimeCache(keySegments[1], keySegments[2], newValue);
            if (!Object.keys(excludeFilters).length && !Object.keys(includeFilters).length) return;
            
            const chatFilterGroupRuntime = chatFilterListsRuntimePatch[keySegments[1]] || {};
            mergeChatFiltersToGroup(chatFilterGroupRuntime, excludeFilters, includeFilters);
            chatFilterListsRuntimePatch[keySegments[1]] = chatFilterGroupRuntime;
            return;
        }
    });

    if (Object.keys(settingValueGroupsRecord).length) {
        messaging.postMessage({ type: "SETTINGS", content: settingValueGroupsRecord });
    }
    if (Object.keys(chatFilterListsRuntimePatch).length) {
        messaging.postMessage({ type: "CHAT_FILTER_GROUPS_PATCH", content: chatFilterListsRuntimePatch });
    }

    if (changes[CHAT_FILTER_GROUPS_KEY]?.newValue) {
        const chatFilterGroupsRuntimePatch = updateChatFilterGroupsRuntimeCache(changes[CHAT_FILTER_GROUPS_KEY].newValue);
        if (Object.keys(chatFilterGroupsRuntimePatch).length) {
            messaging.postMessage({ type: "CHAT_FILTER_GROUPS_PATCH", content: chatFilterGroupsRuntimePatch });
        }
    }
});