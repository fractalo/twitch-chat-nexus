import { derived } from 'svelte/store';
import type { Config } from './types';
import { settingValuesStore } from '../../stores';
import { percentToDecimal } from 'src/util/percentToDecimal';


export const configStore = derived(settingValuesStore, ($settingValuesStore) => {
    if (!$settingValuesStore) return null;

    const openingButtonSettings = $settingValuesStore.chatLogView.openingButton;

    const config: Config = {
        location: openingButtonSettings.location as string,
        windowType: openingButtonSettings.windowType as string,
        alwaysNewWindow: openingButtonSettings.alwaysNewWindow as boolean,
        popupSize: percentToDecimal(openingButtonSettings.popupSize as string, 1.0),
    };

    return config;
});