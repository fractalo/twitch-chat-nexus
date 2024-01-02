import { derived, writable } from 'svelte/store';
import type { SplitSizeRatio, Config, RenderedChatMessage } from './types';
import { getSettingValueStore } from '../../stores';
import { isNonNullableTuple } from 'src/util/typePredicates';
import { DEFAULT_ROOT_SIZE_RATIO, getStoredRootSizeRatio } from './rootSizeRatio';

export const configStore = derived([getSettingValueStore('filteredChatView')], (stores) => {
    if (!isNonNullableTuple(stores)) return null;

    const [$filteredChatView] = stores;

    const config: Config = {
        isEnabled: $filteredChatView.general.isEnabled,
        useAutoResize: $filteredChatView.behavior.useAutoResize,
        collapseAfter: $filteredChatView.behavior.collapseAfter,
        maxChatMessages: $filteredChatView.behavior.maxChatMessages,
        isLocationReversed: $filteredChatView.appearance.location !== 'top',
        timestampFormat: $filteredChatView.appearance.timestampFormat,
    };

    return config;
});

export const isGutterDraggedStore = writable<boolean>(false);


const storedRootSizeRatio = getStoredRootSizeRatio();
export const initialRootSizeRatio = {
    current: storedRootSizeRatio,
    lastNonZero: storedRootSizeRatio || DEFAULT_ROOT_SIZE_RATIO
};

export const rootSizeRatioStore = writable<SplitSizeRatio>(initialRootSizeRatio);


export const filteredChatMessages = writable<RenderedChatMessage[]>([]);
