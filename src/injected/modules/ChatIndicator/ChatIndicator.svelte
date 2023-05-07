<script lang="ts">
    import { fade } from 'svelte/transition';
    import { type ChatIndicatorConfig, type ChatIndicatorState, type Thickness, HeightClassNames, type Width, WidthClassNames } from "./types";
    import type { SubCategorySettingValues } from 'src/components/settings';
    import { settingValuesStore } from 'src/injected/store';

    const DEFAULT_RESPONSE_TIME = 400;

    let config: ChatIndicatorConfig | null = null;

    let state: ChatIndicatorState = 'idle';

    let timeoutTimer: number | undefined;
    let idleTimer: number | undefined;
    
    let averageResponseTime = DEFAULT_RESPONSE_TIME;

    const getTimeoutTime = () => Math.round(averageResponseTime * 2.3);

    export const setState = (newState: ChatIndicatorState) => {
        state = newState;
        clearTimeout(timeoutTimer);
        clearTimeout(idleTimer);

        if (state === 'waiting') {
            timeoutTimer = window.setTimeout(() => setState('timeout'), getTimeoutTime());
        } else if (state === 'success' || state === 'timeout') {
            idleTimer = window.setTimeout(() => setState('idle'), config?.hideAfter);
        }
    };

    /**
     * update average response time using Exponentially Weighted Moving Average
     * @param reponseTime ms
     * @param weight between 0 and 1
     */
    export const updateResponseTime = (responseTime: number, weight: number) => {
        if (weight <= 0 || weight >= 1) return;

        averageResponseTime = weight * responseTime + (1 - weight) * averageResponseTime;
    };

    export const resetResponseTime = () => {
        averageResponseTime = DEFAULT_RESPONSE_TIME;
    }

    const setConfig = (settings: SubCategorySettingValues) => {
        config = {
            hideAfter: settings.behavior.hideAfter as number,
            showState: {
                success: settings.behavior.showSuccess as boolean,
                timeout: settings.behavior.showTimeout as boolean,
                waiting: settings.behavior.showWaiting as boolean,
            },
            colorTheme: {
                waiting: 'bg-neutral-500',
                success: 'bg-green-500',
                timeout: 'bg-orange-500',
            },
            height: HeightClassNames[settings.appearance.thickness as Thickness],
            width: WidthClassNames[settings.appearance.width as Width],
        };
    };

    settingValuesStore.subscribe((settingValues) => {
        settingValues && setConfig(settingValues.chatIndicator);
    });
    

</script>

{#if config}
{#key state}
<div in:fade={{duration: 150}} out:fade class="absolute w-full h-0 z-50 pointer-events-none">
    <div 
        class="
            mx-auto mt-[0.3rem] rounded-full
            {config.width}
            {config.height}
            {config.showState[state] ? config.colorTheme[state] || 'bg-transparent' : 'bg-transparent'}
        "
    ></div>
</div>
{/key}
{/if}
