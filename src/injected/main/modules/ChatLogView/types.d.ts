export type SortOrder = "ASC" | "DESC";

export type PaginationDirection = 'previous' | 'next';

export interface ChatLogRequestConfig {
    pageSize: number;
    cursor: string | null;
    direction: PaginationDirection;
}

export interface ChatLogStyleState {
    hideChatUsername: boolean;
}

export interface Seperator {
    element: HTMLElement;
    index: number;
}

export interface SeparatorState {
    index: number;
    isIntersecting: boolean;
}

