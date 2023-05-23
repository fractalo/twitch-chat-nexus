<script lang="ts">
    import { createPopperActions } from 'svelte-popperjs';
    import { scale } from 'svelte/transition';
    import { cubicInOut, cubicOut } from 'svelte/easing';
    import type { Placement } from '@popperjs/core';

    export let text: string = '';
    export let placement: Placement = 'top';

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
>
    <slot />
</div>

{#if showTooltip}
    <div id="tch-tooltip" use:popperContent={extraOpts} >
        <div 
            in:scale={{delay: transitionInDelay, duration: 100, start: 0.9, easing: cubicOut}}
            out:scale={{duration: 100, start: 0.9, easing: cubicInOut}}
        >
            <div id="tch-tooltip-content" class="select-none">{text}</div>
            <div id="tch-tooltip-arrow" data-popper-arrow />
        </div>
    </div>
{/if}


<style>
    #tch-tooltip {
        z-index: 5000;
    }

    #tch-tooltip-content {
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

    #tch-tooltip-arrow,
    #tch-tooltip-arrow::before {
        position: absolute;
        width: 6px;
        height: 6px;
    }

    #tch-tooltip-arrow {
        visibility: hidden;
        z-index: -1;
    }

    #tch-tooltip-arrow::before {
        visibility: visible;
        content: " ";
        transform: rotate(45deg);
        background-color: var(--color-background-tooltip);
        box-shadow: rgba(0, 0, 0, 0.1) -1px -1px 1px;
    }


    :global(#tch-tooltip[data-popper-placement^='top'] #tch-tooltip-arrow) {
        bottom: -3px;
    }

    :global(#tch-tooltip[data-popper-placement^='bottom'] #tch-tooltip-arrow) {
        top: -3px;
    }

    :global(#tch-tooltip[data-popper-placement^='left'] #tch-tooltip-arrow) {
        right: -3px;
    }

    :global(#tch-tooltip[data-popper-placement^='right'] #tch-tooltip-arrow) {
        left: -3px;
    }

    :global(#tch-tooltip[data-popper-placement^='top'] #tch-tooltip-arrow::before) {
        border-radius: 0 0 var(--border-radius-small) 0;
    }

    :global(#tch-tooltip[data-popper-placement^='bottom'] #tch-tooltip-arrow::before) {
        border-radius: var(--border-radius-small) 0 0 0;
    }

    :global(#tch-tooltip[data-popper-placement^='left'] #tch-tooltip-arrow::before) {
        border-radius: 0 var(--border-radius-small) 0 0;
    }

    :global(#tch-tooltip[data-popper-placement^='right'] #tch-tooltip-arrow::before) {
        border-radius: 0 0 0 var(--border-radius-small); 
    }
</style>