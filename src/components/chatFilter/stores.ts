import { readable, writable, type Writable } from "svelte/store";
import type { ChatBadgeVersionById, ChatBadgeVersionsBySetId, ChatFilterGroup, ChatFilterGroups, ChatFilterType, SubscriberTier } from "./types";
import { CHAT_FILTER_GROUPS_KEY, getChatFilterGroups, getGlobalChatBadges } from "./utils";
import { distinctWritable } from "src/util/distinctStore";
import type { HelixChatBadgeVersionData } from "@twurple/api/lib/interfaces/endpoints/chat.external";
import { isRecord } from "src/util/typePredicates";

export const isGroupListOpenStore = writable<boolean>(false);


let workingFilterGroupId: string | null = null;

export const workingFilterGroupIdStore = distinctWritable<string | null>(workingFilterGroupId);

workingFilterGroupIdStore.subscribe(id => {
    workingFilterGroupId = id;
    workingFilterGroupId && chrome.storage.session.set({ workingChatFilterGroupId: workingFilterGroupId });
});




export const filterGroupsStore = writable<ChatFilterGroups>({}, (set) => {
    Promise.all([
        getChatFilterGroups(),
        chrome.storage.session.get('workingChatFilterGroupId')
    ])
    .then(([groups, { workingChatFilterGroupId }]) => {
        set(groups);

        if (!workingChatFilterGroupId) return;

        if (workingChatFilterGroupId in groups) {
            workingFilterGroupIdStore.set(workingChatFilterGroupId);
        }  
    });

    const handleStorageChange: Parameters<typeof chrome.storage.local.onChanged.addListener>[0] = (changes) => {
        const key = Object.keys(changes).find(key => key === CHAT_FILTER_GROUPS_KEY);
        if (!key || !changes[key].newValue) return;

        set(changes[key].newValue);
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
        chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
});

filterGroupsStore.subscribe(groups => {
    if (workingFilterGroupId && !(workingFilterGroupId in groups)) {
        workingFilterGroupIdStore.set(null);
    }
});



export const globalChatBadgesStore = readable<ChatBadgeVersionsBySetId>({}, (set) => {
    getGlobalChatBadges()
    .then(badges => {
        set(
            badges.reduce((obj, badge) => {

                obj[badge.set_id] = badge.versions.reduce((versions, version) => {
                    versions.set(version.id, version);
                    return versions;
                }, new Map() as Map<string, HelixChatBadgeVersionData>);

                return obj;
            }, {} as ChatBadgeVersionsBySetId)
        );
    });
});

export const getBadgeFirstVersion = (versions?: ChatBadgeVersionById) => {
    if (!versions?.size) return;

    const [ version ] = versions.values();
    return version;
};

export const getBadgeTitle = (versions?: ChatBadgeVersionById) => {
    if (versions?.size !== 1) return;
    const [ version ] = versions.values();
    return version.title;
};


interface UsernameFilterFormData {
    username: string;
    description: string;
}

export const usernameFilterFormStore = writable<UsernameFilterFormData>({
    username: '', 
    description: '',
});


interface KeywordFilterFormData {
    keyword: string;
}

export const keywordFilterFormStore = writable<KeywordFilterFormData>({
    keyword: '', 
});





interface BadgeFilterFormData {
    setId: string;
}

interface GeneralBadgeFilterFormData {
    isAllVersions: boolean;
    versionIds: Set<string>;
    versionRanges: Set<string>;
}

interface SubscriberBadgeFilterFormData {
    hasSubscriberBadge: boolean;
    isAllTiers: boolean;
    isAllMonths: boolean;
    tiers: SubscriberTier[];
    months: Set<string>;
    monthRanges: Set<string>;
}

export const badgeFilterFormStore = writable<BadgeFilterFormData>({
    setId: '',
});

export const generalBadgeFilterFormStore = writable<GeneralBadgeFilterFormData>({
    isAllVersions: true,
    versionIds: new Set(),
    versionRanges: new Set(),
});

export const subscriberBadgeFilterFormStore = writable<SubscriberBadgeFilterFormData>({
    hasSubscriberBadge: true,
    isAllTiers: true,
    isAllMonths: true,
    tiers: [],
    months: new Set(),
    monthRanges: new Set(),
});


export const filterFormDataStores = {
    username: usernameFilterFormStore,
    keyword: keywordFilterFormStore,
    badge: badgeFilterFormStore,
} satisfies Record<ChatFilterType, Writable<Record<string, any>>>;