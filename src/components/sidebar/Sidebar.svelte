<script context="module" lang="ts">
  import type { MenuItem } from '../types';

  export const SIDEBAR_MENUITEMS: MenuItem[] = [
    {
      id: 'chatLogViewSettings',
      icon: faClockRotateLeft
    },
    {
      id: 'chatIndicatorSettings',
      icon: faPaperPlane
    },
    {
      id: 'filteredChatView',
      icon: faComments,
      submenuIds: [
        'settings',
        'filterEditor'
      ],
      isExpanded: true,
      isNew: true,
    }
  ];
</script>

<script lang="ts">
  import { 
    faClockRotateLeft, 
    faPaperPlane,
    faComments,
  } from '@fortawesome/free-solid-svg-icons';
  import SidebarItemSlim from './SidebarItemSlim.svelte';
  import SidebarItem from './SidebarItem.svelte';
  import { isSidebarExpandedStore } from '../stores';


  let screenWidth: number;
  
</script>

<svelte:window bind:innerWidth={screenWidth} />

<div class="flex-none bg-base-300 w-16 z-10"
  class:lg:w-56={$isSidebarExpandedStore}
>
  <div class="w-full h-full" data-simplebar>
    <ul class="menu menu-primary p-1"
      class:lg:p-2={$isSidebarExpandedStore}
    >
      {#each SIDEBAR_MENUITEMS as menuItem (menuItem.id)}
        {#if screenWidth >= 1024 && $isSidebarExpandedStore}
          <SidebarItem {menuItem} />
        {:else}
          <SidebarItemSlim {menuItem} />
        {/if}
      {/each}
    </ul>
  </div>
</div>