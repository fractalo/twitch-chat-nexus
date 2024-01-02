import { derived } from 'svelte/store';
import { HeightClassNames, type Config, toWidthCssValue } from './types';
import { getSettingValueStore } from '../../stores';
import { isNonNullableTuple } from 'src/util/typePredicates';


export const configStore = derived([getSettingValueStore('chatIndicator')], (stores) => {
    if (!isNonNullableTuple(stores)) return null;

    const [$chatIndicator] = stores;

    const config: Config = {
        hideAfter: $chatIndicator.behavior.hideAfter,
        showState: {
            success: $chatIndicator.behavior.showSuccess,
            timeout: $chatIndicator.behavior.showTimeout,
            waiting: $chatIndicator.behavior.showWaiting,
        },
        colorTheme: {
            waiting: 'bg-neutral-500',
            success: 'bg-green-500',
            timeout: 'bg-orange-500',
        },
        height: HeightClassNames[$chatIndicator.appearance.thickness],
        width: toWidthCssValue($chatIndicator.appearance.width),
    };

    return config;
});