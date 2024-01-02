import type { ChatMessageInternal } from "src/util/twitch/types";
import type { TimestampFormat } from "src/components/settings/definitions/filteredChatView";

export interface Config {
    isEnabled: boolean;
    useAutoResize: boolean;
    collapseAfter: number; // seconds
    maxChatMessages: number;
    isLocationReversed: boolean;
    timestampFormat: TimestampFormat;
}

export interface SplitSizeRatio {
    current: number;
    lastNonZero: number;
}

export interface ChatMessage {
    id: string;
    nonce?: string;
    timestamp?: number;
    channelLogin?: string;
    userLogin?: string;
    userDisplayName?: string;
    userColor?: string;
    badges?: Record<string, unknown>;
    badgeDynamicData?: Record<string, unknown>;
    messageBody?: string;
}

export interface RenderedChatMessage {
    element: Element;
    message: ChatMessage;
}
