<script lang="ts">
  import { type IconDefinition, faAngleDown, faAngleUp, faShare } from "@fortawesome/free-solid-svg-icons";
  import { fade } from "svelte/transition";
  import { configStore, isGutterDraggedStore, rootSizeRatioStore } from "./stores";
  import { createEventDispatcher } from 'svelte';
  import { i18n } from "src/i18n";
  import GutterButton from "./GutterButton.svelte";

  export let direction: "horizontal" | "vertical";

  interface Events {
    'click:resize': null;
    'click:share': null;
  }
  
  const dispatch = createEventDispatcher<Events>();

  let isMouseover = false;

  const handleMouseenter = () => {
      isMouseover = true;
  };

  const handleMouseleave = () => {
      isMouseover = false;
  };

  $: showButtons = isMouseover && !$isGutterDraggedStore;

  let resizeButtonArrow: IconDefinition | undefined;
  let resizeButtonLabel: string | undefined;

  $: if ($configStore) {
    if ($rootSizeRatioStore.current) {
      resizeButtonArrow = $configStore.isLocationReversed ? faAngleDown : faAngleUp;
      resizeButtonLabel = $i18n.t('filteredChatView.collapse', { ns: 'mainApp' });
    } else {
      resizeButtonArrow = $configStore.isLocationReversed ? faAngleUp : faAngleDown;
      resizeButtonLabel = $i18n.t('filteredChatView.expand', { ns: 'mainApp' });
    }
  }
  
  const handleResizeButtonClick = () => dispatch('click:resize');
  const handleShareButtonClick = () => dispatch('click:share');

</script>

<div class="tcn-gutter-{direction} flex w-full h-full place-items-center"
  class:tcn-gutter-dragged={$isGutterDraggedStore}
  on:mouseenter={handleMouseenter}
  on:mouseleave={handleMouseleave}
  role="presentation"
>
  <div class="tcn-gutter-line"></div>

  {#if showButtons}
    <div class="absolute flex gap-2 right-4 z-[1]"
      in:fade={{duration: 100}}
      out:fade={{duration: 50}}
    >
      <GutterButton icon={faShare} tooltipText={$i18n.t('filteredChatView.share', { ns: 'mainApp' })} on:click={handleShareButtonClick} />  

      {#if resizeButtonArrow}
      {#key resizeButtonLabel}
        <GutterButton icon={resizeButtonArrow} tooltipText={resizeButtonLabel} isDelayed={true} on:click={handleResizeButtonClick} />        
      {/key}
      {/if}
    </div>
  {/if}
</div>

<style>
  .tcn-gutter-horizontal {
    cursor: sw-resize;
  }

  .tcn-gutter-vertical {
    cursor: ns-resize;
  }

  .tcn-gutter-horizontal .tcn-gutter-line {
    width: 1px;
    height: 100%;
  }
  .tcn-gutter-vertical .tcn-gutter-line {
    width: 100%;
    height: 1px;
  }
  .tcn-gutter-line {
    background-color: var(--color-border-base);
  }

  .tcn-gutter-horizontal:hover .tcn-gutter-line,
  .tcn-gutter-horizontal:active .tcn-gutter-line,
  .tcn-gutter-horizontal.tcn-gutter-dragged .tcn-gutter-line {
    width: 3px;
    background-color: var(--color-border-brand);
    transition: 0.2s 0s;
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  .tcn-gutter-vertical:hover .tcn-gutter-line,
  .tcn-gutter-vertical:active .tcn-gutter-line,
  .tcn-gutter-vertical.tcn-gutter-dragged .tcn-gutter-line {
    height: 3px;
    background-color: var(--color-border-brand);
    transition: 0.2s 0s;
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
</style>