import type { ChatFilterGroupsRuntime, ChatFiltersRuntime, GeneralBadgeSelection, SubscriberTier } from "src/components/chatFilter/types";
import type { ChatMessage } from "./types";
import { chatFilterGroupsStore } from "../../stores";
import { toStringSafe } from "src/util/converters";
import { includesString } from "src/util/typePredicates";
import { isInRanges } from "src/util/SafeRange";

let chatFilterGroups: ChatFilterGroupsRuntime | null = null;

chatFilterGroupsStore.subscribe(value => chatFilterGroups = value);


const SUBSCRIBER_BADGE_ID = 'subscriber';
const FOUNDER_BADGE_ID = 'founder';

const SUBSCRIBER_TIRES: Readonly<SubscriberTier[]> = ["1", "2", "3"]  as const;

interface SubscriberBadgeVersion {
    tier: SubscriberTier;
    months: string;
}

const matchesUsernameFilter = (chatMessage: ChatMessage, filters: ChatFiltersRuntime): boolean => {
    const { userLogin, userDisplayName } = chatMessage;

    if (userLogin && filters.usernames?.has(userLogin)) {
        return true;
    }
    if (userDisplayName && filters.usernames?.has(userDisplayName)) {
        return true;
    }
    return false;
};

const matchesNoSubscriberBadgeFilter = (chatMessage: ChatMessage, filters: ChatFiltersRuntime): boolean => {
    const { badges } = chatMessage;

    return Boolean(
        filters.subscriberBadge?.selectNoSubscriberBadge &&
        badges &&
        !Object.hasOwn(badges, SUBSCRIBER_BADGE_ID)
    );
};

const parseSubscriberBadgeVersion = (version: string | undefined): SubscriberBadgeVersion | undefined => {
    if (!version) return;

    if (version.length <= 3) {
        return { tier: "1", months: version };
    }

    if (includesString(SUBSCRIBER_TIRES, version[0])) {
        return { tier: version[0], months: version.slice(1) };
    }
};

const matchesBadgeFilter = (chatMessage: ChatMessage, filters: ChatFiltersRuntime): boolean => {
    const { badges, badgeDynamicData } = chatMessage;
    if (!badges || !filters.badges) return false;

    for (const [badgeId, version] of Object.entries(badges)) {
        let selection: GeneralBadgeSelection | null | undefined;
        let versionStr: string | undefined;
        let versionNum: number = NaN;

        if (badgeId === SUBSCRIBER_BADGE_ID) {
            const selections = filters.subscriberBadge?.selections;
            if (selections === undefined) continue;
            if (selections === null) return true;

            const subscriberVersion = parseSubscriberBadgeVersion(toStringSafe(version));
            if (subscriberVersion) {
                const { tier, months } = subscriberVersion;
                selection = selections.get(tier);
                versionStr = months;
                versionNum = Number(badgeDynamicData?.[badgeId]);
                if (Number.isNaN(versionNum)) {
                    versionNum = Number(versionStr);
                }
            }
        } else {
            selection = filters.badges.get(badgeId);
            versionStr = toStringSafe(version);
            versionNum = Number(badgeId === FOUNDER_BADGE_ID ? badgeDynamicData?.[badgeId] : versionStr);
        }

        if (selection === undefined) continue;
        if (selection === null) return true;

        if (versionStr && selection.versions.has(versionStr)) {
            return true;
        }    

        if (!Number.isNaN(versionNum) && isInRanges(versionNum, selection.versionRanges)) {
            return true;
        }
    }
    return false;
};

const matchesKeywordFilter = (chatMessage: ChatMessage, filters: ChatFiltersRuntime): boolean => {
    const { messageBody } = chatMessage;
    if (!messageBody || !filters.keywords) return false;

    for (const keyword of filters.keywords) {
        if (messageBody.includes(keyword)) {
            return true;
        }
    }
    return false;
};

const matchesFilter = (chatMessage: ChatMessage, filters?: ChatFiltersRuntime): boolean => {
    if (!filters) return false;

    const filterFunctions = [
        matchesUsernameFilter,
        matchesNoSubscriberBadgeFilter,
        matchesBadgeFilter,
        matchesKeywordFilter
    ];

    return filterFunctions.some(matches => matches(chatMessage, filters));
};

export const filterChat = (chatMessage: ChatMessage): boolean => {
    if (!chatFilterGroups) return false;

    const appliedFilterGroups = Object.values(chatFilterGroups).filter(filterGroup => {
        if (!filterGroup.isActive) return false;
        if (filterGroup.channelIds === null) return true;
        return chatMessage.channelLogin && filterGroup.channelIds?.has(chatMessage.channelLogin);
    });

    for (const filterGroup of appliedFilterGroups) {
        if (matchesFilter(chatMessage, filterGroup.excludeFilters)) {
            return false;
        }
    }

    for (const filterGroup of appliedFilterGroups) {
        if (matchesFilter(chatMessage, filterGroup.includeFilters)) {
            return true;
        }
    }

    return false;
};