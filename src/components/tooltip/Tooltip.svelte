<script lang="ts">
  import type { Placement } from "@floating-ui/core";
  import { arrow, createFloatingActions } from "svelte-floating-ui";
  import { offset } from "svelte-floating-ui/dom";
  import { cubicInOut, cubicOut } from "svelte/easing";
  import { fade } from "svelte/transition";
  import { writable } from 'svelte/store';
  import Portal from "svelte-portal";

  export let placement: Placement;
  export let text: string;
  export let showTooltip: boolean = false;
  export let isDisabled: boolean = false;
  export let delayMs: number = 100;

  const setShowTooltip = (show: boolean) => showTooltip = show;

  const arrowRef = writable<HTMLElement>();

  const [ tooltipRef, tooltipContent ] = createFloatingActions({
    strategy: "fixed",
    placement,
    middleware: [
      offset(7),
      arrow({element: arrowRef})
    ],
    onComputed({ placement, middlewareData }) {
      const arrow = middlewareData.arrow;
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]];

      if ($arrowRef && staticSide) {
        Object.assign($arrowRef.style, {
          left: arrow?.x != null ? `${arrow.x}px` : "",
          top: arrow?.y != null ? `${arrow.y}px` : "",
          [staticSide]: "-4px"
        });
      }
    }
  });

</script>

<slot {tooltipRef} {setShowTooltip} />

{#if showTooltip && !isDisabled}
  <Portal target="body">
    <div class="fixed z-20" use:tooltipContent > 
      <div class="floating-tooltip py-1 px-1.5 rounded text-sm font-normal select-none" 
        in:fade={{delay: delayMs, duration: 100, easing: cubicOut}}
        out:fade={{duration: 100, easing: cubicInOut}}
      >
        {text}
        <div class="absolute w-2 h-2 rotate-45 bg-inherit" bind:this={$arrowRef}></div>
      </div>
    </div>
  </Portal>
{/if}

