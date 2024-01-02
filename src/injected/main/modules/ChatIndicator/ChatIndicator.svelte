<script lang="ts">
    import { fade } from 'svelte/transition';
    import { type ChatSendingState } from "./types";
    import { configStore } from './stores';

    const DEFAULT_RESPONSE_TIME = 400;

    let state: ChatSendingState = 'idle';

    let timeoutTimer: number | undefined;
    let idleTimer: number | undefined;
    
    let averageResponseTime = DEFAULT_RESPONSE_TIME;

    const getTimeoutTime = () => Math.round(averageResponseTime * 2.3);

    export const setState = (newState: ChatSendingState) => {
        state = newState;
        clearTimeout(timeoutTimer);
        clearTimeout(idleTimer);

        if (state === 'waiting') {
            timeoutTimer = window.setTimeout(() => setState('timeout'), getTimeoutTime());
        } else if (state === 'success' || state === 'timeout') {
            idleTimer = window.setTimeout(() => setState('idle'), $configStore?.hideAfter);
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
    };

</script>

{#if $configStore}
{#key state}
<div in:fade={{duration: 150}} out:fade class="absolute w-full h-0 z-50 pointer-events-none">
    <div class="mx-auto mt-[0.3rem] w-[calc(100%-0.6rem)] h-0">
        <div 
            class="
                mx-auto rounded-full
                {$configStore.height}
                {$configStore.showState[state] ? $configStore.colorTheme[state] || 'bg-transparent' : 'bg-transparent'}
            "
            style="width: {$configStore.width};"
        ></div>
    </div>
</div>
{/key}
{/if}
