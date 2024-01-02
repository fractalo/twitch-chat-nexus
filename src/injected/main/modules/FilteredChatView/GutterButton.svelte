<script lang="ts">
    import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
    import ChatIconButton from "../../components/ChatIconButton.svelte";
    import Tooltip from "../../components/Tooltip.svelte";
    import type { Placement } from '@popperjs/core';
    import { configStore, rootSizeRatioStore } from "./stores";

    export let icon: IconDefinition;
    export let tooltipText: string = '';
    export let disabled: boolean = false;
    export let isDelayed: boolean = false;

    let tooltipPlacement: Placement | undefined;

    $: if ($configStore) {
        if ($rootSizeRatioStore.current) {
            tooltipPlacement = $configStore.isLocationReversed ? 'bottom' : 'top';
        } else {
            tooltipPlacement = $configStore.isLocationReversed ? 'top' : 'bottom';
        }
    }

</script>

<div 
    on:mousedown={e => e.stopPropagation()}
    role="presentation"
>
    {#if tooltipText}
        <Tooltip text={tooltipText} {isDelayed} placement={tooltipPlacement}>
            <ChatIconButton {icon} {disabled} on:click/>
        </Tooltip>
    {:else}
        <ChatIconButton {icon} {disabled} on:click/>
    {/if}
</div>