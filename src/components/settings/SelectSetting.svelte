<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SettingValue } from "./settings";

    export let id: string;
    export let value: SettingValue;
    export let settingName: string;
    export let options: {id: string, name: string}[];

    const dispatch = createEventDispatcher();
</script>

<label for={id} class="label">
    <span class="label-text">
        {settingName}
    </span>
</label>
{#if typeof value === 'string'}
    <select id={id} class="select select-sm"
        bind:value={value}
        on:change={() => dispatch('change')}
    >
        {#each options as option}
        <option value={option.id}>
            {option.name || option.id}
        </option>
        {/each}
    </select>
{/if}
