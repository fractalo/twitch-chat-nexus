import type { SafeRange } from "src/util/SafeRange";
import type { 
    HelixChatBadgeSetData, 
    HelixChatBadgeVersionData,
} from "@twurple/api/lib/interfaces/endpoints/chat.external";

export interface BaseFilter {
    id: string;
    isActive: boolean;
    isIncluded: boolean;
    modifiedAt: number;
}

export interface UsernameFilter extends BaseFilter {
    type: 'username';
    username: string; // user name or display name
    description?: string;
}

export type UsernameDescriptions = Record<string, string>;

export interface KeywordFilter extends BaseFilter {
    type: 'keyword';
    keyword: string;
}

interface BaseBadgeFilter extends BaseFilter {
    type: 'badge';
    setId: string;
}

export interface GeneralBadgeFilter extends BaseBadgeFilter {
    badgeType: 'general';
    versions?: string[];
    versionRanges?: SafeRange[];
}

export type SubscriberTier = "1" | "2" | "3";

export interface SubscriberBadgeFilter extends BaseBadgeFilter {
    badgeType: 'subscriber';
    setId: 'subscriber';
    hasSubscriberBadge: boolean;
    tiers?: SubscriberTier[]; // if undefiend, select all tier
    months?: string[]; 
    monthRanges?: SafeRange[]; 
}

export type ChatFilterType = ChatFilter['type'];

export type BadgeFilter = GeneralBadgeFilter | SubscriberBadgeFilter;

export type ChatFilter = UsernameFilter | KeywordFilter | BadgeFilter;

export type ChatFilterListMap = {
    username: Record<string, UsernameFilter>;
    keyword: Record<string, KeywordFilter>;
    badge: Record<string, BadgeFilter>;
};


export interface ChatFilterGroup {
    id: string;
    name: string;
    modifiedAt: number;
    filterCount: number;
    isActive: boolean;
    isGlobal: boolean;
    channelIds?: string[]; 
}

export type ChatFilterGroups = Record<string, ChatFilterGroup>; // key: uuid group id



export interface GeneralBadgeSelection {
    versions: Set<string>;
    versionRanges: SafeRange[];
}

export interface SubscriberBadgeSelection {
    selectNoSubscriberBadge: boolean; // if true, chat with no subscriber badge also selected.
    selections?: Map<SubscriberTier, GeneralBadgeSelection | null> | null; // if null, select all
}

export interface ChatFiltersRuntime {
    usernames?: Set<string>;
    keywords?: Set<string>;
    badges?: Map<string, GeneralBadgeSelection | null>; // if null, select all
    subscriberBadge?: SubscriberBadgeSelection;
}

export interface ChatFilterGroupRuntime {
    isActive?: boolean;
    channelIds?: Set<string> | null; // if null, applied globally
    excludeFilters?: ChatFiltersRuntime;
    includeFilters?: ChatFiltersRuntime;
}

export type ChatFilterGroupsRuntime = Record<string, ChatFilterGroupRuntime>; // key: uuid group id


export type CachedGlobalChatBadges = {
    updatedAt: number;
    globalChatBadges: HelixChatBadgeSetData[];
};

export type ChatBadgeVersionById = Map<string, HelixChatBadgeVersionData>;

export type ChatBadgeVersionsBySetId = Partial<Record<string, ChatBadgeVersionById>>;



export interface ExportedChatFilterGroup extends Omit<ChatFilterGroup, "filterCount"> {
    filterCount?: undefined;
    filters: ChatFilter[];
}

export interface ImportedChatFilterGroup extends ExportedChatFilterGroup {
    
}