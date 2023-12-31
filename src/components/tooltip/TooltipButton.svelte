<script lang="ts">
  import type { Placement } from "@floating-ui/core";
  import Tooltip from "./Tooltip.svelte";

  export let placement: Placement;
  export let label: string;
  export let disabled: boolean = false;

  let showTooltip = false;

</script>

<Tooltip 
  {placement}
  {showTooltip}
  text={label}
  let:tooltipRef
>
  <button 
    class={$$props.class}
    on:mouseenter={() => showTooltip = true}
    on:mouseleave={() => showTooltip = false}
    on:click
    {disabled}
    use:tooltipRef
  >
    <slot />
  </button>
</Tooltip>