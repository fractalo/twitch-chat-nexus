<script lang="ts">
  import Fa from 'svelte-fa';
  import { 
    faAngleRight,
  } from '@fortawesome/free-solid-svg-icons';
  import { i18n } from 'src/i18n';
  import { activePageStore, noticedMenuIdsStore } from '../stores';
  import { onMount } from 'svelte';
  import { fade } from "svelte/transition";
  import { createFloatingActions } from "svelte-floating-ui";
  import { shift } from "svelte-floating-ui/dom";
  import type { MenuItem } from '../types';
  import Tooltip from '../tooltip/Tooltip.svelte';

  export let menuItem: MenuItem;

  const { id, icon } = menuItem; 
  const submenuIds = menuItem.submenuIds || [];

  $: hasSubmenu = !!submenuIds.length;


  let isActive = false;
  let activeSubmenu: string | undefined;

  let showTooltip = false;
  let showSubmenu = false;

  let menuEl: HTMLElement;
  let submenuEl: HTMLElement;

  onMount(() => {
    if (hasSubmenu) {
      document.addEventListener('click', (event) => {
        if (
          showSubmenu && 
          event.target instanceof Node && 
          !menuEl.contains(event.target) &&
          !submenuEl.contains(event.target)
        ) {
          showSubmenu = false;
        }
      });
    }

    activePageStore.subscribe(activePage => {
      if (!hasSubmenu) {
        isActive = activePage === id;
        return;
      }
      activeSubmenu = submenuIds.find(submenuId => activePage === `${id}.${submenuId}`);
      isActive = !!activeSubmenu;
    });
  });

  const handleMenuClick = () => {
    showTooltip = false;
    if (!hasSubmenu) {
      $noticedMenuIdsStore = new Set([...($noticedMenuIdsStore || []), menuItem.id]);
      return activePageStore.set(id);
    }
    showSubmenu = !showSubmenu;
  };

  const handleSubmenuClick = (submenuId: string) => {
    $noticedMenuIdsStore = new Set([...($noticedMenuIdsStore || []), menuItem.id]);
    activePageStore.set(`${id}.${submenuId}`);
    showSubmenu = false;
  };

  const [ submenuRef, submenuContent ] = createFloatingActions({
    strategy: "fixed",
    placement: "right-start",
    middleware: [
      shift()
    ]
  });
  
</script>


<Tooltip
  placement="right"
  text={$i18n.t(`sidebar.${id}`, {ns: 'optionApp'})}
  showTooltip={!showSubmenu && showTooltip}
  let:tooltipRef
>
  <li bind:this={menuEl}>
    <a
      class="{isActive ? 'active cursor-pointer' : ''} py-3 px-0 flex justify-center"
      class:submenu-toggle={hasSubmenu}
      href={null}
      on:click={handleMenuClick}
      on:mouseenter={() => showTooltip = true}
      on:mouseleave={() => showTooltip = false}
      use:tooltipRef
      use:submenuRef
    >
      <Fa class="text-lg" {icon} />
      {#if hasSubmenu}
        <Fa class="absolute right-1.5" icon={faAngleRight} />
      {/if}
      {#if menuItem.isNew && $noticedMenuIdsStore && !$noticedMenuIdsStore.has(menuItem.id)}
        <div class="absolute top-0.5 right-0.5 badge badge-xs badge-secondary"></div>
      {/if}
    </a>
  </li>

  {#if showSubmenu}
    <ul 
      bind:this={submenuEl}
      class="fixed menu shadow-lg bg-base-300 min-w-40 rounded-box ml-2 z-10 before:hidden" 
      use:submenuContent
      transition:fade={{duration: 100}}
    >
      <li class="menu-title">{$i18n.t(`sidebar.${id}`, {ns: 'optionApp'})}</li>
      {#each submenuIds as submenuId}
        <li>
          <a 
            class="{activeSubmenu === submenuId ? 'active cursor-pointer' : ''}"
            href={null}
            on:click={() => handleSubmenuClick(submenuId)}
          >
            {$i18n.t($i18n.t(`sidebar.${submenuId}`, {ns: 'optionApp'}))}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</Tooltip>