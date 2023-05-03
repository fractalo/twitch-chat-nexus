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
    showState: Partial<Record<ChatIndicatorState, boolean>>;
    colorTheme: Partial<Record<ChatIndicatorState, string>>;
    height: string;
    width: string;
}

export type ChatIndicatorState = 'idle' | 'waiting' | 'success' | 'timeout';


export type Thickness = 'light' | 'normal' | 'bold';

export const HeightClassNames: Record<Thickness, string> = {
    light: 'h-[0.2rem]',
    normal: 'h-[0.3rem]',
    bold: 'h-[0.4rem]',
} as const;

export type Width = '10%' | '20%' | '30%' | '50%' | '75%' | '100%';

export const WidthClassNames: Record<Width, string> = {
    '10%': 'w-[10%]',
    '20%': 'w-[20%]',
    '30%': 'w-[30%]',
    '50%': 'w-[50%]',
    '75%': 'w-[75%]',
    '100%': 'w-[calc(100%-0.6rem)]'
} as const;
