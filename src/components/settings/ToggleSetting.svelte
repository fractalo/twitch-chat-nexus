<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SettingValue } from "./types";

    export let value: SettingValue;
    export let settingName: string;

    const dispatch = createEventDispatcher();

</script>

<label class="label">
    <span class="label-text">
        {settingName}
    </span>
    {#if typeof value === 'boolean'}
        <input type="checkbox" class="toggle toggle-primary"
            bind:checked={value}
            on:change={() => dispatch('change')}
        />
    {/if}
</label>