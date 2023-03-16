<script lang="ts">
    import { fade } from 'svelte/transition';
    import type { ChatIndicatorConfig, ChatIndicatorState } from "./types";

    const DEFAULT_RESPONSE_TIME = 400;

    let config: ChatIndicatorConfig = {
        hideAfter: 3000
    };
    let stateBgColors: Partial<Record<ChatIndicatorState, string>> = {
        waiting: 'bg-gray-500',
        success: 'bg-green-500',
        timeout: 'bg-orange-500',
    };
    let state: ChatIndicatorState = 'idle';

    let timeoutTimer: number | undefined;
    let idleTimer: number | undefined;
    
    let averageResponseTime = DEFAULT_RESPONSE_TIME;

    const getTimeoutTime = () => Math.round(averageResponseTime * 2);
    

    export const setState = (newState: ChatIndicatorState) => {
        state = newState;
        clearTimeout(timeoutTimer);
        clearTimeout(idleTimer);

        if (state === 'waiting') {
            timeoutTimer = window.setTimeout(() => setState('timeout'), getTimeoutTime());
        } else if (state === 'success' || state === 'timeout') {
            idleTimer = window.setTimeout(() => setState('idle'), config.hideAfter);
        }
    };

    export const setConfig = (newConfig: ChatIndicatorConfig) => {
        config = newConfig;
    };

    /**
     * update average response time using Exponentially Weighted Moving Average
     * @param reponseTime ms
     * @param weight between 0 and 1
     */
    export const updateResponseTime = (responseTime: number, weight: number) => {
        if (weight <= 0 || weight >= 1) return;

        averageResponseTime = weight * responseTime + (1 - weight) * averageResponseTime;
        console.log('new average response time:', averageResponseTime);
    };

    export const resetResponseTime = () => {
        averageResponseTime = DEFAULT_RESPONSE_TIME;
    }
    

</script>

{#if state !== 'idle'}
<div out:fade class="absolute w-full z-50 pointer-events-none">
    <div class="h-1 w-[98%] mt-1 mx-auto transition {stateBgColors[state] || 'bg-transparent'}"></div>
</div>
{/if}
