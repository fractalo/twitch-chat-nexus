<script lang="ts">
  import { i18n } from "src/i18n";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import Dropdown from "./Dropdown.svelte";
  import FunnelSolid from "../icons/funnelSolid.svelte";
  import FunnelOutline from "../icons/funnelOutline.svelte";

  export let isActive: boolean;
  
</script>

<Dropdown
  config={{
    strategy: 'absolute',
    placement: 'bottom-end'
  }}
  useAutoToggle={true}
>
  <svelte:fragment 
    slot="button"
    let:dropdownRef
    let:toggleOpen
  >
    <Tooltip 
      placement="top"
      text={$i18n.t('filters')}
      let:tooltipRef
      let:setShowTooltip
    >
      <button 
        class="btn btn-sm btn-square btn-ghost"
        use:dropdownRef
        use:tooltipRef
        on:click={toggleOpen}
        on:mouseenter={() => setShowTooltip(true)}
        on:mouseleave={() => setShowTooltip(false)}
      >
        {#if isActive}
          <FunnelSolid class="w-5 h-5 text-primary" />
        {:else}
          <FunnelOutline class="w-5 h-5 opacity-60"/>
        {/if}
      </button>
    </Tooltip>
  </svelte:fragment>

  <div 
    slot="content" 
    let:dropdownContent
    let:setIsOpen
    class="absolute z-10 flex flex-col p-2 gap-1 bg-base-200 shadow-lg rounded-box min-w-[10rem] w-auto"
    use:dropdownContent
    
  >
    <slot {setIsOpen}/>
  </div>
</Dropdown>