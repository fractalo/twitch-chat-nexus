import {
    getChromeLocalStorageItem,
    removeChromeLocalStorageItems,
    setChromeLocalStorageItem,
} from "src/util/storage";
import {
    includesString,
    isRecord,
    isUnknownArray,
} from "src/util/typePredicates";
import type {
    SubscriberTier,
    ChatFilterGroups,
    ChatFilterGroupsRuntime,
    ChatFilterListMap,
    ChatFiltersRuntime,
    GeneralBadgeSelection,
    SubscriberBadgeSelection,
    UsernameFilter,
    KeywordFilter,
    BadgeFilter,
    ChatFilterGroupRuntime,
    UsernameDescriptions,
    ChatFilterType,
    CachedGlobalChatBadges,
    ChatFilterGroup,
    ExportedChatFilterGroup,
    ChatFilter,
    GeneralBadgeFilter,
    SubscriberBadgeFilter,
    BaseFilter,
    ImportedChatFilterGroup,
} from "./types";
import { areSetsEqual } from "src/util/areSetsEqual";
import type { HelixChatBadgeSetData } from "@twurple/api/lib/interfaces/endpoints/chat.external";
import axios from "axios";
import {
    type SafeRange,
    toRangeString,
    toSafeRangeArray,
    mergeRanges,
} from "src/util/SafeRange";
import { saveAs } from "file-saver";
import { toStringSafe, toTimestampSafe } from "src/util/converters";
import dayjs from "dayjs";

export const CHAT_FILTER_GROUPS_KEY = "chatFilterGroups";
export const CHAT_FILTERS_KEY_PREFIX = "chatFilters";

export const CHAT_FILTER_TYPES = ["username", "keyword", "badge"] as const;

export const SUBSCRIBER_BADGE_TYPE = "subscriber";

export const SUBSCRIBER_TIRES: SubscriberTier[] = ["1", "2", "3"];

const CACHED_GLOBAL_CHAT_BADGES_KEY = "cachedGlobalChatBadges";

export const getChatFilterGroups = async (): Promise<ChatFilterGroups> => {
    const storedChatFilterGroups: unknown = await getChromeLocalStorageItem(
        CHAT_FILTER_GROUPS_KEY
    );
    if (!isRecord(storedChatFilterGroups)) {
        return {};
    }
    return storedChatFilterGroups as ChatFilterGroups;
};

export const setChatFilterGroups = (chatFilterGroups: ChatFilterGroups) => {
    setChromeLocalStorageItem(CHAT_FILTER_GROUPS_KEY, chatFilterGroups);
};

export const getChatFilterList = async <T extends ChatFilterType>(
    id: string,
    type: T
): Promise<ChatFilterListMap[T]> => {
    const key = [CHAT_FILTERS_KEY_PREFIX, id, type].join(".");
    const storedList: unknown = await getChromeLocalStorageItem(key);
    if (!isRecord(storedList)) {
        return {};
    }
    return storedList as ChatFilterListMap[T];
};

export const setChatFilterList = <T extends ChatFilterType>(
    id: string,
    type: T,
    list: ChatFilterListMap[T]
) => {
    const key = [CHAT_FILTERS_KEY_PREFIX, id, type].join(".");
    setChromeLocalStorageItem(key, list);
};

export const removeChatFilterLists = (id: string) => {
    removeChromeLocalStorageItems(
        CHAT_FILTER_TYPES.map((type) =>
            [CHAT_FILTERS_KEY_PREFIX, id, type].join(".")
        )
    );
};

const getCachedGlobalChatBadges =
    async (): Promise<CachedGlobalChatBadges | null> => {
        const cachedGlobalChatBadges: unknown = await getChromeLocalStorageItem(
            CACHED_GLOBAL_CHAT_BADGES_KEY
        );
        if (!isRecord(cachedGlobalChatBadges)) {
            return null;
        }
        return cachedGlobalChatBadges as CachedGlobalChatBadges;
    };

const setCachedGlobalChatBadges = (
    globalChatBadges: HelixChatBadgeSetData[]
) => {
    setChromeLocalStorageItem(CACHED_GLOBAL_CHAT_BADGES_KEY, {
        updatedAt: Date.now(),
        globalChatBadges,
    } satisfies CachedGlobalChatBadges);
};

export const getGlobalChatBadges = async (): Promise<
    HelixChatBadgeSetData[]
> => {
    const cache = await getCachedGlobalChatBadges();
    if (cache && Date.now() - cache.updatedAt < 12 * 60 * 60 * 1000) {
        return cache.globalChatBadges;
    }

    try {
        const response = await axios.get<HelixChatBadgeSetData[]>(
            "https://twitch-api-worker.fractalo.workers.dev/chat/global-badges",
            {
                responseType: "json",
            }
        );

        if (response.data.length) {
            setCachedGlobalChatBadges(response.data);
            return response.data;
        }
    } catch {}

    return cache?.globalChatBadges || [];
};

const getUsernameFiltersRuntime = (
    filterList: Record<string, UsernameFilter>
) => {
    const includeFilter = new Set<string>();
    const excludeFilter = new Set<string>();

    Object.values(filterList).forEach((filter) => {
        if (!filter.isActive) return;
        const usernames = filter.isIncluded ? includeFilter : excludeFilter;
        usernames.add(filter.username.toLowerCase());
    });
    return { excludeFilter, includeFilter };
};

const getKeywordFiltersRuntime = (
    filterList: Record<string, KeywordFilter>
) => {
    const includeFilter = new Set<string>();
    const excludeFilter = new Set<string>();

    Object.values(filterList).forEach((filter) => {
        if (!filter.isActive) return;
        const keywords = filter.isIncluded ? includeFilter : excludeFilter;
        keywords.add(filter.keyword.toLowerCase());
    });
    return { excludeFilter, includeFilter };
};

const getBadgeFiltersRuntime = (filterList: Record<string, BadgeFilter>) => {
    const badgesIncludeFilter = new Map<string, GeneralBadgeSelection | null>();
    const badgesExcludeFilter = new Map<string, GeneralBadgeSelection | null>();
    const subscriberBadgeIncludeFilter: SubscriberBadgeSelection = {
        selectNoSubscriberBadge: false,
    };
    const subscriberBadgeExcludeFilter: SubscriberBadgeSelection = {
        selectNoSubscriberBadge: false,
    };

    Object.values(filterList).forEach((filter) => {
        if (!filter.isActive) return;

        switch (filter.badgeType) {
            case "general": {
                const badges = filter.isIncluded
                    ? badgesIncludeFilter
                    : badgesExcludeFilter;

                let selection = badges.get(filter.setId);
                if (selection === null) return;

                if (!filter.versions && !filter.versionRanges) {
                    badges.set(filter.setId, null);
                    return;
                }
                if (selection === undefined) {
                    selection = {
                        versions: new Set<string>(),
                        versionRanges: [],
                    };
                    badges.set(filter.setId, selection);
                }
                filter.versions &&
                    filter.versions.forEach((version) =>
                        selection?.versions.add(version)
                    );
                filter.versionRanges &&
                    selection.versionRanges.push(...filter.versionRanges);
                break;
            }
            case "subscriber": {
                const subscriberBadge = filter.isIncluded
                    ? subscriberBadgeIncludeFilter
                    : subscriberBadgeExcludeFilter;

                if (!filter.hasSubscriberBadge) {
                    subscriberBadge.selectNoSubscriberBadge = true;
                    return;
                }
                if (subscriberBadge.selections === null) return;

                if (!filter.tiers && !filter.months && !filter.monthRanges) {
                    subscriberBadge.selections = null;
                    return;
                }
                if (subscriberBadge.selections === undefined) {
                    subscriberBadge.selections = new Map<
                        SubscriberTier,
                        GeneralBadgeSelection | null
                    >();
                }
                filter.tiers ??= ["1", "2", "3"];

                for (const tier of filter.tiers) {
                    let monthSelection = subscriberBadge.selections.get(tier);
                    if (monthSelection === null) continue;

                    if (!filter.months && !filter.monthRanges) {
                        subscriberBadge.selections.set(tier, null);
                        continue;
                    }
                    if (monthSelection === undefined) {
                        monthSelection = {
                            versions: new Set<string>(),
                            versionRanges: [],
                        };
                        subscriberBadge.selections.set(tier, monthSelection);
                    }
                    filter.months &&
                        filter.months.forEach((month) =>
                            monthSelection?.versions.add(month)
                        );
                    filter.monthRanges &&
                        monthSelection.versionRanges.push(...filter.monthRanges);
                }
                break;
            }
            default:
        }
    });

    const mergeVersionRanges = (selection: GeneralBadgeSelection | null) => {
        if (!selection) return;
        selection.versionRanges = mergeRanges(selection.versionRanges);
    };

    badgesExcludeFilter.forEach(mergeVersionRanges);
    badgesIncludeFilter.forEach(mergeVersionRanges);

    subscriberBadgeExcludeFilter.selections?.forEach(mergeVersionRanges);
    subscriberBadgeIncludeFilter.selections?.forEach(mergeVersionRanges);

    return {
        badgesExcludeFilter,
        badgesIncludeFilter,
        subscriberBadgeExcludeFilter,
        subscriberBadgeIncludeFilter,
    };
};

let cachedChatFilterGroupsRuntime: ChatFilterGroupsRuntime = {};

let isCachedChatFilterGroupsRuntimeReady = false;

const initCachedChatFilterGroupsRuntime =
    async (): Promise<ChatFilterGroupsRuntime> => {
        const chatFilterGroups = await getChatFilterGroups();
        updateChatFilterGroupsRuntimeCache(chatFilterGroups);

        await Promise.all(
            Object.keys(chatFilterGroups).map((id) =>
                Promise.all(
                    CHAT_FILTER_TYPES.map((filterType) =>
                        getChatFilterList(id, filterType).then((filterList) => {
                            updateChatFilterListsRuntimeCache(
                                id,
                                filterType,
                                filterList
                            );
                        })
                    )
                )
            )
        );

        isCachedChatFilterGroupsRuntimeReady = true;
        return cachedChatFilterGroupsRuntime;
    };

let cachedChatFilterGroupsRuntimePromise: Promise<ChatFilterGroupsRuntime> | null =
    null;

export const getAllChatFilterGroupsRuntime =
    async (): Promise<ChatFilterGroupsRuntime> => {
        if (isCachedChatFilterGroupsRuntimeReady) {
            return cachedChatFilterGroupsRuntime;
        }
        if (cachedChatFilterGroupsRuntimePromise) {
            return cachedChatFilterGroupsRuntimePromise;
        }
        return (cachedChatFilterGroupsRuntimePromise =
            initCachedChatFilterGroupsRuntime());
    };

export const mergeChatFiltersToGroup = (
    chatFilterGroupRuntime: ChatFilterGroupRuntime,
    excludeFilters: ChatFiltersRuntime,
    includeFilters: ChatFiltersRuntime
) => {
    chatFilterGroupRuntime.excludeFilters = {
        ...chatFilterGroupRuntime.excludeFilters,
        ...excludeFilters,
    };
    chatFilterGroupRuntime.includeFilters = {
        ...chatFilterGroupRuntime.includeFilters,
        ...includeFilters,
    };
};

/**
 *
 * @param id
 * @param type
 * @param newFilterList
 * @returns
 */
export const updateChatFilterListsRuntimeCache = <T extends ChatFilterType>(
    id: string,
    type: T,
    newFilterList: ChatFilterListMap[T]
) => {
    const excludeFilters: ChatFiltersRuntime = {};
    const includeFilters: ChatFiltersRuntime = {};

    switch (type) {
        case "username": {
            const usernameFilters = getUsernameFiltersRuntime(
                newFilterList as Record<string, UsernameFilter>
            );
            excludeFilters.usernames = usernameFilters.excludeFilter;
            includeFilters.usernames = usernameFilters.includeFilter;
            break;
        }
        case "keyword": {
            const keywordFilters = getKeywordFiltersRuntime(
                newFilterList as Record<string, KeywordFilter>
            );
            excludeFilters.keywords = keywordFilters.excludeFilter;
            includeFilters.keywords = keywordFilters.includeFilter;
            break;
        }
        case "badge": {
            const badgeFilters = getBadgeFiltersRuntime(
                newFilterList as Record<string, BadgeFilter>
            );
            excludeFilters.badges = badgeFilters.badgesExcludeFilter;
            includeFilters.badges = badgeFilters.badgesIncludeFilter;
            excludeFilters.subscriberBadge =
                badgeFilters.subscriberBadgeExcludeFilter;
            includeFilters.subscriberBadge =
                badgeFilters.subscriberBadgeIncludeFilter;
            break;
        }
        default:
    }

    const cachedChatFilterGroupRuntime =
        cachedChatFilterGroupsRuntime[id] || {};

    const deleteTargetSetIfEqual = (
        base: ChatFiltersRuntime | undefined,
        target: ChatFiltersRuntime,
        setName: "usernames" | "keywords"
    ) => {
        if (areSetsEqual(base?.[setName], target[setName])) {
            delete target[setName];
        }
    };

    deleteTargetSetIfEqual(
        cachedChatFilterGroupRuntime.excludeFilters,
        excludeFilters,
        "usernames"
    );
    deleteTargetSetIfEqual(
        cachedChatFilterGroupRuntime.includeFilters,
        includeFilters,
        "usernames"
    );
    deleteTargetSetIfEqual(
        cachedChatFilterGroupRuntime.excludeFilters,
        excludeFilters,
        "keywords"
    );
    deleteTargetSetIfEqual(
        cachedChatFilterGroupRuntime.includeFilters,
        includeFilters,
        "keywords"
    );

    mergeChatFiltersToGroup(
        cachedChatFilterGroupRuntime,
        excludeFilters,
        includeFilters
    );

    cachedChatFilterGroupsRuntime[id] = cachedChatFilterGroupRuntime;

    return { excludeFilters, includeFilters };
};

/**
 *
 * @param chatFilterGroups
 * @returns
 */
export const updateChatFilterGroupsRuntimeCache = (
    chatFilterGroups: ChatFilterGroups
) => {
    const chatFilterGroupsRuntimePatch: ChatFilterGroupsRuntime = {};

    Object.values(chatFilterGroups).forEach((chatFilterGroup) => {
        const { id } = chatFilterGroup;
        const cachedChatFilterGroupRuntime =
            cachedChatFilterGroupsRuntime[id] || {};

        const chatFilterGroupRuntime: ChatFilterGroupRuntime = {
            isActive: chatFilterGroup.isActive,
            channelIds: chatFilterGroup.isGlobal
                ? null
                : new Set(
                      chatFilterGroup.channelIds?.map((id) => id.toLowerCase())
                  ),
        };

        if (
            chatFilterGroupRuntime.isActive ===
            cachedChatFilterGroupRuntime.isActive
        ) {
            delete chatFilterGroupRuntime.isActive;
        } else {
            cachedChatFilterGroupRuntime.isActive =
                chatFilterGroupRuntime.isActive;
        }

        if (
            areSetsEqual(
                chatFilterGroupRuntime.channelIds,
                cachedChatFilterGroupRuntime.channelIds
            )
        ) {
            delete chatFilterGroupRuntime.channelIds;
        } else {
            cachedChatFilterGroupRuntime.channelIds =
                chatFilterGroupRuntime.channelIds;
        }

        cachedChatFilterGroupsRuntime[id] = cachedChatFilterGroupRuntime;

        if (Object.keys(chatFilterGroupRuntime).length) {
            chatFilterGroupsRuntimePatch[id] = chatFilterGroupRuntime;
        }
    });

    Object.keys(cachedChatFilterGroupsRuntime).forEach((id) => {
        if (!Object.hasOwn(chatFilterGroups, id)) {
            delete cachedChatFilterGroupsRuntime[id];
            chatFilterGroupsRuntimePatch[id] = {};
        }
    });

    return chatFilterGroupsRuntimePatch;
};

let isExporting: boolean = false;

export const exportChatFilterGroups = async (groups: ChatFilterGroup[]) => {
    if (isExporting) return;
    isExporting = true;

    const exportedGroups: ExportedChatFilterGroup[] = [];

    await Promise.all(
        groups.map(async (group) => {
            const filters: ChatFilter[] = [];

            await Promise.all(
                CHAT_FILTER_TYPES.map((type) =>
                    getChatFilterList(group.id, type).then((filterList) =>
                        filters.push(...Object.values(filterList))
                    )
                )
            );

            exportedGroups.push({
                ...group,
                filterCount: undefined,
                filters,
            });
        })
    );

    const jsonString = JSON.stringify(exportedGroups);
    const blob = new Blob([jsonString], { type: "text/plain;charset=utf-8" });

    saveAs(blob, `tcn_chat_filters-${dayjs().format('YYYYMMDD_HHmmss')}.json`);

    isExporting = false;
};

const getValidChatFilters = (value: unknown): ChatFilter[] => {
    let arr: unknown[];
    if (isRecord(value)) {
        arr = Object.values(value);
    } else if (isUnknownArray(value)) {
        arr = value;
    } else {
        arr = [];
    }

    const getValidUsernameFilter = (
        baseFilter: BaseFilter,
        obj: Record<string, unknown>
    ): UsernameFilter | null => {
        const username = toStringSafe(obj.username)?.trim();
        if (!username) return null;

        const description = toStringSafe(obj.description);

        return {
            ...baseFilter,
            type: "username",
            username,
            description,
        };
    };

    const getValidKeywordFilter = (
        baseFilter: BaseFilter,
        obj: Record<string, unknown>
    ): KeywordFilter | null => {
        const keyword = toStringSafe(obj.keyword);
        if (!keyword) return null;

        return {
            ...baseFilter,
            type: "keyword",
            keyword,
        };
    };

    const getValidGeneralBadgeFilter = (
        baseFilter: BaseFilter,
        obj: Record<string, unknown>
    ): GeneralBadgeFilter | null => {
        const setId = toStringSafe(obj.setId)?.trim();
        if (!setId) return null;

        let versions: string[] | undefined;
        if (isUnknownArray(obj.versions)) {
            versions = [
                ...new Set(
                    obj.versions
                        .map((value) => toStringSafe(value)?.trim() ?? "")
                        .filter(Boolean)
                ),
            ];
        }

        let versionRanges: SafeRange[] | undefined;
        if (isUnknownArray(obj.versionRanges)) {
            versionRanges = toSafeRangeArray(obj.versionRanges);
        }

        return {
            ...baseFilter,
            type: "badge",
            badgeType: "general",
            setId,
            versions,
            versionRanges,
        };
    };

    const getValidSubscriberBadgeFilter = (
        baseFilter: BaseFilter,
        obj: Record<string, unknown>
    ): SubscriberBadgeFilter | null => {
        if (typeof obj.hasSubscriberBadge !== "boolean") return null;

        let tiers: SubscriberTier[] | undefined;
        if (isUnknownArray(obj.tiers)) {
            tiers = [
                ...new Set(
                    obj.tiers
                        .map((value) => toStringSafe(value)?.trim() ?? "")
                        .filter((str): str is SubscriberTier =>
                            includesString(SUBSCRIBER_TIRES, str)
                        )
                ),
            ];
        }

        let months: string[] | undefined;
        if (isUnknownArray(obj.months)) {
            months = [
                ...new Set(
                    obj.months
                        .map((value) => toStringSafe(value)?.trim() ?? "")
                        .filter((str) => {
                            if (!str) return false;
                            const num = Number(str);
                            return !isNaN(num) && num >= 0;
                        })
                ),
            ];
        }

        let monthRanges: SafeRange[] | undefined;
        if (isUnknownArray(obj.monthRanges)) {
            monthRanges = toSafeRangeArray(obj.monthRanges);
        }

        return {
            ...baseFilter,
            type: "badge",
            badgeType: "subscriber",
            setId: "subscriber",
            hasSubscriberBadge: obj.hasSubscriberBadge,
            tiers,
            months,
            monthRanges,
        };
    };

    const filterIds = new Set<string>();

    const filters = arr
        .map((obj): ChatFilter | null => {
            if (
                !isRecord(obj) ||
                typeof obj.isActive !== "boolean" ||
                typeof obj.isIncluded !== "boolean"
            )
                return null;

            let id = toStringSafe(obj.id)?.trim();
            if (!id || filterIds.has(id)) {
                id = window.crypto.randomUUID();
            }
            filterIds.add(id);

            const modifiedAt = toTimestampSafe(obj.modifiedAt) ?? 0;

            const baseFilter: BaseFilter = {
                id,
                isActive: obj.isActive,
                isIncluded: obj.isIncluded,
                modifiedAt,
            };

            if (obj.type === "username")
                return getValidUsernameFilter(baseFilter, obj);
            else if (obj.type === "keyword")
                return getValidKeywordFilter(baseFilter, obj);
            else if (obj.type === "badge" && obj.badgeType === "general")
                return getValidGeneralBadgeFilter(baseFilter, obj);
            else if (obj.type === "badge" && obj.badgeType === "subscriber")
                return getValidSubscriberBadgeFilter(baseFilter, obj);
            return null;
        })
        .filter((obj): obj is ChatFilter => Boolean(obj));

    return filters;
};

export const getValidImportedChatFilterGroups = (
    dataArr: unknown[]
): ImportedChatFilterGroup[] => {
    const groupIds = new Set<string>();
    let sequence = 1;

    const groups = dataArr
        .map((obj): ImportedChatFilterGroup | null => {
            if (!isRecord(obj)) return null;

            const filters = getValidChatFilters(obj.filters);

            let name = toStringSafe(obj.name)?.trim();

            if (
                (typeof obj.isGlobal !== "boolean" || !name) &&
                !filters.length
            ) {
                return null;
            }

            let id = toStringSafe(obj.id)?.trim();
            if (!id || groupIds.has(id)) {
                id = window.crypto.randomUUID();
            }
            groupIds.add(id);

            name ||= `Group ${sequence++}`;

            const modifiedAt = toTimestampSafe(obj.modifiedAt) ?? 0;

            const isActive =
                typeof obj.isActive === "boolean" ? obj.isActive : false;
            const isGlobal =
                typeof obj.isGlobal === "boolean" ? obj.isGlobal : true;

            let channelIds: string[] | undefined;
            if (isUnknownArray(obj.channelIds)) {
                channelIds = [
                    ...new Set(
                        obj.channelIds
                            .map((value) => toStringSafe(value)?.trim() ?? "")
                            .filter(Boolean)
                    ),
                ];
            }

            return {
                id,
                name,
                modifiedAt,
                isActive,
                isGlobal,
                channelIds,
                filters,
            };
        })
        .filter((obj): obj is ImportedChatFilterGroup => Boolean(obj));

    return groups;
};
