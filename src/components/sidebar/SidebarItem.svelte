<script lang="ts">
  import Fa from "svelte-fa";
  import { i18n } from "src/i18n";
  import { activePageStore, noticedMenuIdsStore } from "../stores";
  import { onMount } from "svelte";
  import type { MenuItem } from "../types";

  export let menuItem: MenuItem;

  const { id, icon, isExpanded } = menuItem;
  const submenuIds = menuItem.submenuIds || [];

  $: hasSubmenu = !!submenuIds.length;

  let isActive = false;
  let activeSubmenu: string | undefined;

  let showSubmenu = Boolean(isExpanded);

  onMount(() => {
    activePageStore.subscribe((activePage) => {
      if (!hasSubmenu) {
        isActive = activePage === id;
        return;
      }
      activeSubmenu = submenuIds.find(
        (submenuId) => activePage === `${id}.${submenuId}`
      );
    });
  });

  $: isActive = Boolean(activeSubmenu) && !showSubmenu;
  

  const handleMenuClick = () => {
    if (!hasSubmenu) {
      $noticedMenuIdsStore = new Set([...($noticedMenuIdsStore || []), menuItem.id]);
      return activePageStore.set(id);
    }
    showSubmenu = !showSubmenu;
  };

  const handleSubmenuClick = (submenuId: string) => {
    $noticedMenuIdsStore = new Set([...($noticedMenuIdsStore || []), menuItem.id]);
    activePageStore.set(`${id}.${submenuId}`);
  };

</script>

<li>
  <a
    class="
      {isActive ? 'active cursor-pointer' : ''} 
      {hasSubmenu ? `menu-dropdown-toggle ${showSubmenu ? 'menu-dropdown-show' : ''}`: ''}
      py-2.5 gap-2.5
    "
    href={null}
    on:click={handleMenuClick}
  >
    <Fa class="text-lg" {icon} />
    <div class="flex gap-2 items-center">
      <span class="text-sm">{$i18n.t(`sidebar.${id}`, {ns: 'optionApp'})}</span>
      {#if menuItem.isNew && $noticedMenuIdsStore && !$noticedMenuIdsStore.has(menuItem.id)}
        <div class="badge badge-sm badge-secondary whitespace-nowrap">{$i18n.t('new')}</div>
      {/if}
    </div>
  </a>

  {#if hasSubmenu}
    <ul class="menu-dropdown {showSubmenu ? 'menu-dropdown-show' : ''}">
      {#each submenuIds as submenuId}
        <li>
          <a
            class={activeSubmenu === submenuId ? "active cursor-pointer" : ""}
            href={null}
            on:click={() => handleSubmenuClick(submenuId)}
          >
            {$i18n.t($i18n.t(`sidebar.${submenuId}`, {ns: 'optionApp'}))}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</li>
