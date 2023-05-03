import { writable } from 'svelte/store';

export const i18nMessageStore = writable<Record<string, string> | null>(null);
