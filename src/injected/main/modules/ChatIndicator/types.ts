export interface PrivMsg {
    nonce: string;
    sentAt: number;
}

export interface Ping {
    uuid: string;
    sentAt: number;
}

export interface Config {
    hideAfter: number;
    showState: Partial<Record<ChatSendingState, boolean>>;
    colorTheme: Partial<Record<ChatSendingState, string>>;
    height: string;
    width: string;
}

export type ChatSendingState = 'idle' | 'waiting' | 'success' | 'timeout';


export const HeightClassNames: Record<string, string> = {
    light: 'h-[0.2rem]',
    normal: 'h-[0.3rem]',
    bold: 'h-[0.4rem]',
};

export const toWidthCssValue = (percent: number) => {
    if (percent < 0 || percent > 100) {
        percent = 100;
    }
    return `${percent}%`;
};
