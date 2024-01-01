import ChatFilterEditor from "./chatFilter/ChatFilterEditor.svelte";
import Home from "./Home.svelte";
import { getSettingPage } from "./settings";
import type { Page } from "./types";

export const DEFAULT_PAGE = 'home';

export const pages: Partial<Record<string, Page>> = {
    [DEFAULT_PAGE]: { 
        component: Home, 
        useRootSimplebar: false,
     },
    'chatLogViewSettings': getSettingPage({ definitionId: 'chatLogView'}),
    'chatIndicatorSettings': getSettingPage({definitionId: 'chatIndicator'}),
    'filteredChatView.settings': getSettingPage({definitionId: 'filteredChatView'}),
    'filteredChatView.filterEditor': { 
        component: ChatFilterEditor, 
        useRootSimplebar: false,
    },
};