<script lang="ts">
  import logoSrc from 'src/assets/logo.png';
  import { faArrowUpRightFromSquare, faBars } from '@fortawesome/free-solid-svg-icons';
  import { i18n } from 'src/i18n';
  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import { activePageStore, isSidebarExpandedStore } from './stores';
  import TooltipButton from './tooltip/TooltipButton.svelte';
  import Fa from "svelte-fa";
  import LanguageSelector from './dropdown/LanguageSelector.svelte';

  export let isPopup: boolean;

  const openOptionsPage = () => chrome.runtime.openOptionsPage();

  const manifest = chrome.runtime.getManifest();

  const handleLogoClick = () => activePageStore.set('home');

</script>

<nav class="navbar shadow max-lg:min-h-[3rem] bg-base-200 z-20">
  <div class="navbar-start">
    {#if !isPopup}
      <button class="btn max-lg:btn-sm btn-square btn-ghost max-lg:hidden"
        on:click={() => $isSidebarExpandedStore = !$isSidebarExpandedStore}
      >
        <Fa class="text-lg" icon={faBars} />
      </button>
    {/if}
    <button 
      class="btn max-lg:btn-sm btn-ghost !px-2"
      on:click={handleLogoClick}
    >
      <img src={logoSrc} alt="logo" class="w-5 lg:w-7"/>
      <span class="text-sm lg:text-xl normal-case">{manifest.name}</span>
    </button>
  </div>
  <div class="navbar-end">
    {#if isPopup}
      <TooltipButton
        class="btn btn-square btn-ghost btn-sm"
        placement="bottom"
        label={$i18n.t('openInNewTab', {ns: 'optionApp'})}
        on:click={openOptionsPage}
      >
        <Fa icon={faArrowUpRightFromSquare} />
      </TooltipButton>
    {/if}
    
    <LanguageSelector />

    <ThemeSwitcher />
  </div>
</nav>