import type { ChatMessage } from "../FilteredChatView/types";

export interface SelectableChatMessage {
    element: Element;
    timestampEl?: Element;
    message: ChatMessage;
    isChecked: boolean;
}

export interface SelectableChatUser {
    userLogin: string;
    userDisplayName?: string;
    element?: Element;
    isChecked: boolean;
    isIndeterminate: boolean;
    chatMessages: SelectableChatMessage[];
}

export type TimestampFormat = 'hidden' | '12-hour' | '24-hour';

export interface OutputOptions {
    timestampFormat: TimestampFormat;
    imageWidthPixel: number;
    imagePixelRatio: number;
}