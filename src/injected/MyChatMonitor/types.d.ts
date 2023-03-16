export interface PrivMsg {
    nonce: string;
    sentAt: number;
}

export interface Ping {
    uuid: string;
    sentAt: number;
}

export interface ChatIndicatorConfig {
    hideAfter: number;
}

export type ChatIndicatorState = 'idle' | 'waiting' | 'success' | 'timeout';