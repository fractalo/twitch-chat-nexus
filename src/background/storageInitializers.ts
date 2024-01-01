import type { BadgeFilter, UsernameFilter } from "src/components/chatFilter/types";
import { getChatFilterGroups, setChatFilterGroups, setChatFilterList } from "src/components/chatFilter/utils";
import { v4 as uuidv4 } from 'uuid';

export const setupDefaultChatFilters = async() => {
    const filterGroups = await getChatFilterGroups();
    if (Object.keys(filterGroups).length) return;

    const botUsernameFilters: UsernameFilter[] = [
        'nightbot',
        'streamelements',
        'streamlabs',
        'moobot',
        'wizebot',
    ].map(username => {
        return {
            id: uuidv4(),
            isActive: true,
            isIncluded: false,
            modifiedAt: Date.now(),
            type: 'username',
            username,
            description: chrome.i18n.getMessage('chatBot'),
        }
    });

    const badgeFilters: BadgeFilter[] = [
        'broadcaster', 
        'moderator', 
        'vip'
    ].map(setId => {
        return {
            id: uuidv4(),
            isActive: true,
            isIncluded: true,
            modifiedAt: Date.now(),
            type: 'badge',
            setId,
            badgeType: 'general',
        }
    });

    const groupId = uuidv4();

    setChatFilterGroups({
        [groupId]: { 
            id: groupId, 
            name: chrome.i18n.getMessage('defaultFilterGroupName'), 
            isActive: true, 
            isGlobal: true,
            filterCount: botUsernameFilters.length + badgeFilters.length,
            modifiedAt: Date.now(),
        }
    });

    setChatFilterList(
        groupId,
        'username',
        botUsernameFilters.reduce((list, filter) => {
            list[filter.id] = filter;
            return list;
        }, {} as Record<string, UsernameFilter>)
    );

    setChatFilterList(
        groupId,
        'badge',
        badgeFilters.reduce((list, filter) => {
            list[filter.id] = filter;
            return list;
        }, {} as Record<string, BadgeFilter>)
    );
};