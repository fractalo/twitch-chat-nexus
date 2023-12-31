<script lang="ts">
  import Dropdown from "./Dropdown.svelte";
  import { fade } from "svelte/transition";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { i18n } from "src/i18n";
  import i18next from "i18next";
  import Language from '../icons/language.svelte';


  interface MenuItem {
    language: string;
    label: string;
  }

  let currentLangunage = i18next.language;

  let isDropdownOpen: boolean;


  export let items: MenuItem[] = [
    { language: 'en', label: 'English' },
    { language: 'ko', label: '한국어' },
  ];

  $: if (currentLangunage === chrome.i18n.getUILanguage()) {
    window.localStorage.removeItem('language');
  } else {
    window.localStorage.setItem('language', currentLangunage);
  }

    
</script>

<Dropdown
  config={{
      strategy: "absolute",
      placement: 'bottom-end',
  }}
  bind:isOpen={isDropdownOpen}
  useAutoToggle={true}
>
  <svelte:fragment 
    slot="button"
    let:dropdownRef
    let:toggleOpen
  >
    <Tooltip 
      placement="bottom"
      text={$i18n.t('language')}
      let:tooltipRef
      let:setShowTooltip
      isDisabled={isDropdownOpen}
    >
      <button 
        class="btn max-lg:btn-sm btn-square btn-ghost"
        use:dropdownRef
        use:tooltipRef
        on:click={() => {
          !isDropdownOpen && setShowTooltip(false);
          toggleOpen();
        }}
        on:mouseenter={() => setShowTooltip(true)}
        on:mouseleave={() => setShowTooltip(false)}
      >
        <Language class="w-5 h-5 lg:w-6 lg:h-6" />
      </button>
    </Tooltip>
  </svelte:fragment>

  <ul 
    slot="content" 
    let:dropdownContent
    class="absolute z-[1] menu menu-sm gap-0.5 bg-base-200 shadow rounded-box cursor-pointer before:hidden"
    use:dropdownContent
    transition:fade={{duration: 100}}
  >
    {#each items as item}
      <li>
        <a href={null}
          class="whitespace-nowrap"
          class:active={currentLangunage === item.language}
          on:click={() => {
            i18next.changeLanguage(item.language)
            .then(() => currentLangunage = i18next.language);
          }}
        >
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</Dropdown>

