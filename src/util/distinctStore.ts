import { writable, type Writable } from 'svelte/store';

export const distinctWritable = <T>(initialValue: T): Writable<T> => {
    let currentValue = initialValue;
    
    const { subscribe, set, update } = writable<T>(initialValue);

    return {
        set(value) {
            if (value !== currentValue) {
                currentValue = value;
                set(value);
            }
        },
        subscribe,
        update
    };
};