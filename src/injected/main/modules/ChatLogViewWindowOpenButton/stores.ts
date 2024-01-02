import { derived } from 'svelte/store';
import type { Config } from './types';
import { getSettingValueStore } from '../../stores';
import { isNonNullableTuple } from 'src/util/typePredicates';


export const configStore = derived([getSettingValueStore('chatLogView')], (stores) => {
    if (!isNonNullableTuple(stores)) return null;

    const [$chatLogView] = stores;

    const openingButtonSettings = $chatLogView.openingButton;

    const config: Config = {
        location: openingButtonSettings.location,
        windowType: openingButtonSettings.windowType,
        alwaysNewWindow: openingButtonSettings.alwaysNewWindow,
        popupSize: openingButtonSettings.popupSize / 100,
    };

    return config;
});