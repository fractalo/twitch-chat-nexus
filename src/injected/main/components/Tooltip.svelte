<script lang="ts">
    import { createPopperActions } from 'svelte-popperjs';
    import { scale } from 'svelte/transition';
    import { cubicInOut, cubicOut } from 'svelte/easing';
    import type { Placement } from '@popperjs/core';
    import Portal from "svelte-portal";

    export let text: string = '';
    export let placement: Placement = 'top';
    export let isDelayed: boolean = true;
    export let isDisabled: boolean = false;

    const [popperRef, popperContent] = createPopperActions({
        placement,
        strategy: 'fixed',
    });

    const extraOpts = {
        modifiers: [
            { name: 'offset', options: { offset: [0, 10] } }
        ],
    };
    
    let transitionInDelay = 200;
    let showTooltip = false;

    const setShowTooltip = (show: boolean) => showTooltip = show;

    const openTooltip = (delay: number = 0) => {
        transitionInDelay = delay;
        showTooltip = true;
    };

    const closeTooltip = () => showTooltip = false;

    let isMouseover = false;

    const handleMouseenter = () => {
        isMouseover = true;
        openTooltip(200);
    };

    const handleMouseleave = () => {
        isMouseover = false;
        closeTooltip();
    };

    const handleFocusin = (event: FocusEvent) => {
        event.relatedTarget && openTooltip();
    };

    const handleFocusout = () => {
        !isMouseover && closeTooltip();
    };
</script>

<div
    use:popperRef
    on:mouseenter={handleMouseenter}
    on:mouseleave={handleMouseleave}
    on:focusin={handleFocusin}
    on:focusout={handleFocusout}
    role="presentation"
>
    <slot {setShowTooltip} />
</div>

{#if showTooltip && !isDisabled}
    <Portal target="body">
        <div id="tcn-tooltip" use:popperContent={extraOpts} >
            <div 
                in:scale={{delay: isDelayed ? transitionInDelay : 0, duration: 100, start: 0.9, easing: cubicOut}}
                out:scale={{duration: 100, start: 0.9, easing: cubicInOut}}
            >
                <div id="tcn-tooltip-content" class="select-none">{text}</div>
                <div id="tcn-tooltip-arrow" data-popper-arrow />
            </div>
        </div>
    </Portal>
{/if}


<style>
    #tcn-tooltip {
        z-index: 5000;
    }

    #tcn-tooltip-content {
        display: inline-block;
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-heading);
        color: var(--color-text-tooltip);
        background-color: var(--color-background-tooltip);

        font-size: var(--font-size-6);
        border-radius: 0.4rem;
        padding: 0.5rem;
        max-width: 30rem;
    }

    #tcn-tooltip-arrow,
    #tcn-tooltip-arrow::after {
        position: absolute;
        width: 6px;
        height: 6px;
    }

    #tcn-tooltip-arrow {
        visibility: hidden;
        z-index: -1;
    }

    #tcn-tooltip-arrow::after {
        visibility: visible;
        content: " ";
        transform: rotate(45deg);
        background-color: var(--color-background-tooltip);
        box-shadow: rgba(0, 0, 0, 0.1) -1px -1px 1px;
    }

    :global(#tcn-tooltip[data-popper-placement^='top'] #tcn-tooltip-arrow) {
        bottom: -3px;
    }

    :global(#tcn-tooltip[data-popper-placement^='bottom'] #tcn-tooltip-arrow) {
        top: -3px;
    }

    :global(#tcn-tooltip[data-popper-placement^='left'] #tcn-tooltip-arrow) {
        right: -3px;
    }

    :global(#tcn-tooltip[data-popper-placement^='right'] #tcn-tooltip-arrow) {
        left: -3px;
    }

    :global(#tcn-tooltip[data-popper-placement^='top'] #tcn-tooltip-arrow::after) {
        border-radius: 0 0 var(--border-radius-small) 0;
    }

    :global(#tcn-tooltip[data-popper-placement^='bottom'] #tcn-tooltip-arrow::after) {
        border-radius: var(--border-radius-small) 0 0 0;
    }

    :global(#tcn-tooltip[data-popper-placement^='left'] #tcn-tooltip-arrow::after) {
        border-radius: 0 var(--border-radius-small) 0 0;
    }

    :global(#tcn-tooltip[data-popper-placement^='right'] #tcn-tooltip-arrow::after) {
        border-radius: 0 0 0 var(--border-radius-small); 
    }
</style>