<script lang="ts">
  import type { Placement } from "@popperjs/core";
  import Tooltip from "./Tooltip.svelte";
  import IconButton, { type TextPosition } from "./IconButton.svelte";
  import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
  import type { IconButtonType } from "./Button.svelte";


  export let toggleDropdown: () => void;
  export let isDropdownOpen: boolean;

  export let tooltipText: string | undefined = undefined;
  export let tooltipPlacement: Placement | undefined = undefined;
  export let isTooltipDelayed: boolean | undefined = undefined;

  export let buttonIcon: IconDefinition | undefined = undefined;
  export let buttonText: string | undefined = undefined;
  export let buttonTextPosition: TextPosition | undefined = undefined;
  export let isButtonDisabled: boolean | undefined = undefined;
  export let buttonType: IconButtonType | undefined = undefined;
</script>



<Tooltip text={tooltipText} placement={tooltipPlacement} isDelayed={isTooltipDelayed} isDisabled={isDropdownOpen} >
  <svelte:fragment let:setShowTooltip>
    <IconButton type={buttonType} icon={buttonIcon} text={buttonText} textPosition={buttonTextPosition} disabled={isButtonDisabled}
      on:click={() => {
        !isDropdownOpen && setShowTooltip(false); 
        toggleDropdown();
      }}
    />
  </svelte:fragment>
</Tooltip>