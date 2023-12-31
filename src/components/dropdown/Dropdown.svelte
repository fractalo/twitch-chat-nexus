<script lang="ts">
  import { onDestroy } from "svelte";
  import { createFloatingActions, type ComputeConfig } from "svelte-floating-ui";

  export let config: ComputeConfig;

  export let useAutoToggle: boolean = false;

  export let isOpen: boolean = false;

  const setIsOpen = (_isOpen: boolean) => isOpen = _isOpen;

  const toggleOpen = () => isOpen = !isOpen;
  
  let containerEl: HTMLElement | undefined;


  const handleOutsideClick = (event: MouseEvent) => {
    if (
      isOpen && 
      event.target instanceof Node && 
      !containerEl?.contains(event.target)
    ) {
      isOpen = false;
    }
  };

  $: if (isOpen) {
    document.addEventListener('click', handleOutsideClick);
  } else {
    document.removeEventListener('click', handleOutsideClick);
  }

  const [ dropdownRef, dropdownContent ] = createFloatingActions(config);

  onDestroy(() => {
    document.removeEventListener('click', handleOutsideClick);
  });
    
</script>

<div class="relative" bind:this={containerEl}>
  <slot name="button" {dropdownRef} {toggleOpen} />
  {#if useAutoToggle} 
    {#if isOpen}
      <slot name="content" {dropdownContent} {setIsOpen}/>
    {/if}
  {:else}
    <slot name="content" {dropdownContent} {isOpen} {setIsOpen} />
  {/if}
</div>
  
  