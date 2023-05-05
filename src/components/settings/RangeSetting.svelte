<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SettingValue } from "./types";

    export let value: SettingValue;
    export let settingName: string;
    export let id: string;
    export let min: number;
    export let max: number;
    export let step: number;
    export let unit: string | undefined;

    const dispatch = createEventDispatcher();

</script>

<label for={id} class="label">
    <span class="label-text">
        {settingName}
    </span>
</label>
{#if typeof value === 'number'}
    <div class="flex gap-2">
        <input {id} type="range" class="range range-primary"
            bind:value={value}
            on:change={() => dispatch('change')}
            {min}
            {max}
            {step}
        />
        <span class="text-sm font-semibold">
            {`${value}${unit || ''}`}
        </span>
    </div>
{/if}