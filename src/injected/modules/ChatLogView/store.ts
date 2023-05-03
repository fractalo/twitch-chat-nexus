import { writable } from 'svelte/store';
import type { ChatLogStyleState, ChatLogRequestConfig } from './types';
import { DEFAULT_SORT_ORDER } from './constants';

const defaultRequestConfig: ChatLogRequestConfig = {
    pageSize: 300,
    sortOrder: DEFAULT_SORT_ORDER,
    cursor: null
};

export const requestConfig = writable<ChatLogRequestConfig>(defaultRequestConfig);


const defaultChatLogStyleState: ChatLogStyleState = {
    hideChatUsername: false
};

export const chatLogStyleState = writable<ChatLogStyleState>(defaultChatLogStyleState);

