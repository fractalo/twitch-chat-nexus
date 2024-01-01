import { writable, type Writable } from "svelte/store";
import type { SettingGroups, SettingValueGroups, SettingValueGroupsRecord } from "src/components/settings/types";
import { SETTING_DEFINITION_IDS, type SettingDefinitionId, settingDefinitions } from "src/components/settings/definitions";
import type { ChatFilterGroupsRuntime } from "src/components/chatFilter/types";
import { isObjectOwnKey } from "src/util/typePredicates";
import { getChatClient } from "./clients";
import { distinctWritable } from "src/util/distinctStore";
import messaging from "./messaging";
import { SCRIPT_IDS } from "src/messaging";


type SettingValueFromDefinition<T extends SettingGroups> = {
    [K in keyof T]: {
        [P in keyof T[K]]: T[K][P]["default"] extends boolean ? boolean : T[K][P]["default"];
    }
};

type SettingValueGroupsFromDefinition<T extends SettingDefinitionId> = SettingValueFromDefinition<typeof settingDefinitions[T]>;

type SettingValueStores = Record<SettingDefinitionId, Writable<SettingValueGroups | null>>;

export const settingValueStores = SETTING_DEFINITION_IDS.reduce((stores, id) => {
    stores[id] = writable<SettingValueGroups | null>(null);
    return stores;
}, {} as SettingValueStores);

export const getSettingValueStore = <T extends SettingDefinitionId>(id: T) => {
    return settingValueStores[id] as Writable<SettingValueGroupsFromDefinition<T> | null>;
};

export const setSettingValueStores = (settingValueGroupsRecord: SettingValueGroupsRecord) => {
    Object.entries(settingValueGroupsRecord).forEach(([id, settingValueGroups]) => {
        if (isObjectOwnKey(settingValueStores, id)) {
            settingValueStores[id].set(settingValueGroups);
        }
    });
};




let chatFilterGroups: ChatFilterGroupsRuntime | null = null;

export const chatFilterGroupsStore = writable<ChatFilterGroupsRuntime | null>(chatFilterGroups);

chatFilterGroupsStore.subscribe(value => {
    chatFilterGroups = value;
});

export const updateChatFilterGroupsStore = (groupsPatch: ChatFilterGroupsRuntime) => {
    if (!chatFilterGroups) return;

    const newChatFilterGroups: ChatFilterGroupsRuntime = { ...chatFilterGroups };

    Object.entries(groupsPatch).forEach(([id, groupPatch]) => {
        if (!Object.keys(groupPatch).length) {
            delete newChatFilterGroups[id];
            return;
        }
        if (!Object.hasOwn(newChatFilterGroups, id)) {
            return newChatFilterGroups[id] = groupPatch;
        }

        groupPatch.excludeFilters = {
            ...newChatFilterGroups[id].excludeFilters,
            ...groupPatch.excludeFilters
        };
        groupPatch.includeFilters = {
            ...newChatFilterGroups[id].includeFilters,
            ...groupPatch.includeFilters
        };

        newChatFilterGroups[id] = {
            ...newChatFilterGroups[id],
            ...groupPatch
        };
    });

    chatFilterGroupsStore.set(newChatFilterGroups);
};



export const joinedChatChannelStore = distinctWritable<string | null>(null);

getChatClient().then(chatClient => {
    chatClient.on('join', channel => joinedChatChannelStore.set(channel));
});



messaging.on('message', (message) => {
    if (message.from !== SCRIPT_IDS.CONTENT) return;

    switch (message.type) {
        case 'SETTINGS': {
            const settingValueGroupsRecord = message.content as SettingValueGroupsRecord;
            setSettingValueStores(settingValueGroupsRecord);
            break;
        }
        case 'CHAT_FILTER_GROUPS': {
            const chatFilterGroupsRuntime = message.content as ChatFilterGroupsRuntime;
            chatFilterGroupsStore.set(chatFilterGroupsRuntime);
            break;
        }
        case 'CHAT_FILTER_GROUPS_PATCH': {
            const chatFilterGroupsRuntimePatch = message.content as ChatFilterGroupsRuntime;
            updateChatFilterGroupsStore(chatFilterGroupsRuntimePatch);
            break;
        }
        default:
    }
});

messaging.waitForConnected(SCRIPT_IDS.CONTENT)
.then(() => {
    messaging.postMessage({ type: 'GET_ALL_SETTINGS', to: SCRIPT_IDS.CONTENT });
    messaging.postMessage({ type: 'GET_ALL_CHAT_FILTER_GROUPS', to: SCRIPT_IDS.CONTENT });
});