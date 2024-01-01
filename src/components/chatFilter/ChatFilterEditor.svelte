<script lang="ts">
  import { i18n } from "src/i18n";
  import ChatFilterGroupList from "./ChatFilterGroupList.svelte";
  import ChatFilterList from "./ChatFilterList.svelte";
  import HamburgerIcon from '../icons/hamburger.svelte';
  import CloseIcon from '../icons/close.svelte';
  import { fade } from "svelte/transition";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { filterGroupsStore, isGroupListOpenStore, workingFilterGroupIdStore } from "./stores";
  import ToastAlert from "../ToastAlert.svelte";
  import type { Alert } from "../types";

  const MIN_WIDTH_MD = 768;

  let screenWidth: number;

  const handleClickFilterGroup = async() => {
    $isGroupListOpenStore = false;
  };

  let alertMessage: (alert: Alert) => void;

  let groupListTransitionClass: string = '';

  isGroupListOpenStore.subscribe(() => {
    if (screenWidth < MIN_WIDTH_MD) {
      groupListTransitionClass = 'transition-[transform] duration-300 ease-out will-change-transform';
    }
  });

  $: if (screenWidth >= MIN_WIDTH_MD) {
    groupListTransitionClass = '';
  }
  
</script>


<svelte:window bind:innerWidth={screenWidth} />


<div class="max-w-screen-2xl mx-auto h-full">
  <div 
    class="flex flex-col h-full gap-1 overflow-hidden {screenWidth >= MIN_WIDTH_MD ? 'p-3.5 lg:p-8' : '' } "
  >
    <div class="flex gap-1 items-center {screenWidth < MIN_WIDTH_MD ? 'p-3.5 pb-0' : ''}">
      {#if screenWidth < MIN_WIDTH_MD}
        <Tooltip 
          placement="bottom-start"
          text={$isGroupListOpenStore ? $i18n.t('close') : $i18n.t('filterGroupList', { ns: 'optionApp' })}
          let:tooltipRef
          let:setShowTooltip
          delayMs={$isGroupListOpenStore ? 200 : 100}
        >
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <label class="btn btn-sm btn-circle swap swap-rotate"
            on:mouseenter={() => setShowTooltip(true)}
            on:mouseleave={() => setShowTooltip(false)}
            on:click={() => setShowTooltip(false)}
            use:tooltipRef
          >
            <input type="checkbox" bind:checked={$isGroupListOpenStore} />
            <HamburgerIcon class="swap-off fill-current w-5 h-5 " />
            <CloseIcon class="swap-on fill-current w-5 h-5 " />
          </label>
        </Tooltip>
      {/if}
      
      <h1 class="text-lg lg:text-xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
        {#if screenWidth >= MIN_WIDTH_MD}
          {$i18n.t('chatFilterEditor', { ns: 'optionApp' })}
        {:else if $isGroupListOpenStore}
          {$i18n.t('filterGroupList', { ns: 'optionApp' })}
        {:else}
          {$filterGroupsStore[$workingFilterGroupIdStore ?? '']?.name ?? ''}
        {/if}
      </h1>
    </div>

    <div class="grow min-h-0">
      <div class="flex h-full relative"
        class:gap-4={screenWidth >= MIN_WIDTH_MD}
      >
        <div 
          class={`
            ${
              (screenWidth >= MIN_WIDTH_MD) ?
              "w-[18rem] lg:w-[22rem]" : 
              `
                absolute z-10 h-full w-full bg-base-100
                ${
                  $isGroupListOpenStore ? 'translate-x-0' : 'translate-x-[-100%]'
                }
              `
            }

            ${screenWidth < MIN_WIDTH_MD ? 'p-3.5 pt-0' : ''}

            ${groupListTransitionClass}
          `}
          
        >
          <ChatFilterGroupList 
            on:click:group={handleClickFilterGroup} 
            on:alert={event => alertMessage(event.detail)}
          />
        </div>
        <div 
          class={`
            min-w-0 grow shrink 
            ${
              (screenWidth >= MIN_WIDTH_MD) ?
              "" : 
              `
                transition-[transform,opacity] duration-300 ease-out
                ${
                  $isGroupListOpenStore ? 'translate-x-[10%] opacity-0' : 'translate-x-0 opacity-100'
                }
              `
            }

            ${screenWidth < MIN_WIDTH_MD ? 'p-3.5 pt-0' : ''}
          `}
        >
          <ChatFilterList 
            on:alert={event => alertMessage(event.detail)}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<ToastAlert bind:alertMessage />

