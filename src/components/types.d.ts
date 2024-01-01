export interface DaisyUiModalElement extends HTMLElement {
    showModal: () => void;
    close: () => void;
}

export type AlertLevel = 'normal' | 'info' | 'success' | 'warning' | 'error';

export interface Alert {
    message: string;
    level: AlertLevel;
}