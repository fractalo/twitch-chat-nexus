export type SortOrder = "ASC" | "DESC";

export interface ChatLogRequestConfig {
    pageSize: number;
    sortOrder: SortOrder;
    cursor: string | null;
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

