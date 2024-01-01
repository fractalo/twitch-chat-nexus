export type AlertLevel = 'normal' | 'info' | 'success' | 'warning' | 'error';

export interface Alert {
    message: string;
    level: AlertLevel;
}