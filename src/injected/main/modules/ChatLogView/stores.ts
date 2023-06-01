import { writable } from 'svelte/store';
import type { ChatLogStyleState, ChatLogRequestConfig } from './types';

const defaultRequestConfig: ChatLogRequestConfig = {
    pageSize: 300,
    cursor: null,
    direction: 'next',
};

export const requestConfig = writable<ChatLogRequestConfig>(defaultRequestConfig);


const defaultChatLogStyleState: ChatLogStyleState = {
    hideChatUsername: false
};

export const chatLogStyleState = writable<ChatLogStyleState>(defaultChatLogStyleState);

