<script lang="ts">
  import { onDestroy } from "svelte";

    export let useAutoToggle: boolean = true;

    let isOpen = false;

    let containerEl: HTMLElement | undefined;

    const toggleDropdown = () => {
        isOpen = !isOpen;
    };

    const handleOutsideClick = (event: MouseEvent) => {
        if (
            event.isTrusted &&
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

    onDestroy(() => {
        document.removeEventListener('click', handleOutsideClick);
    });

</script>


<div class="relative" bind:this={containerEl} >
    <slot name="button" {toggleDropdown} isDropdownOpen={isOpen} />
    {#if useAutoToggle} 
        {#if isOpen}
            <slot name="body" />
        {/if}
    {:else}
        <slot name="body" isDropdownOpen={isOpen} />
    {/if}
    
</div>