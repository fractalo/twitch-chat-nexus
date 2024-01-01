<script lang="ts">
  import { faEllipsisVertical, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import Dropdown from "./Dropdown.svelte";
  import { fade } from "svelte/transition";

  type MenuItemType = 'normal' | 'error';
  
  interface MenuItem {
    handler: () => any;
    text: string;
    icon?: IconDefinition;
    type?: MenuItemType;
  }

  export let items: MenuItem[] = [];

  const classNamesByType: Record<MenuItemType, string> = {
    normal: 'text-base-content',
    error: 'text-error hover:text-error',
  };

    
</script>

<Dropdown
  config={{
      strategy: "absolute",
      placement: 'bottom-end',
  }}
  useAutoToggle={true}
>
  <button 
    slot="button" 
    let:dropdownRef
    let:toggleOpen
    class="btn btn-sm btn-circle btn-ghost"
    use:dropdownRef
    on:click={toggleOpen}
  >
    <Fa class="text-lg" icon={faEllipsisVertical} />
  </button>

  <ul 
    slot="content" 
    let:dropdownContent
    let:setIsOpen
    class="absolute z-[1] menu menu-sm m-0 p-2 bg-base-200 shadow rounded-box cursor-default before:hidden"
    use:dropdownContent
    transition:fade={{duration: 100}}
  >
    {#each items as item}
      <li>
        <a href={null}
          class="whitespace-nowrap {item.type ? classNamesByType[item.type] : classNamesByType.normal}"
          on:click={() => { 
            item.handler(); 
            setIsOpen(false);
          }}
        >
          {#if item.icon}
            <Fa class="text-sm" icon={item.icon} />
          {/if}
          {item.text}
        </a>
      </li>
    {/each}
  </ul>
</Dropdown>

