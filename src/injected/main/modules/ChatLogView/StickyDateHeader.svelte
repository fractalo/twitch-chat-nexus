<script lang="ts">
  import debounce from 'lodash/debounce';
  import { fade } from 'svelte/transition';
  import type { SeparatorState, Seperator } from './types';
  import { sineInOut } from 'svelte/easing';
  import { chatLogStyleState } from './stores';

  export let modLogsPageEl: HTMLElement;

  const TIMEOUT = 800;

  let isVisible: boolean = false;

  let scrollContentEl: HTMLElement | null = null;

  let currentDateSeparator: Seperator | null = null;

  const showDateHeader = () => {
    isVisible = true;
  }; 
  const hideDateHeader = () => {
    isVisible = false;
  };
  
  const debouncedHideDateHeader = debounce(hideDateHeader, TIMEOUT);

  const scrollListener = () => {
    showDateHeader();
    debouncedHideDateHeader();
  }; 


  let separatorObservers: IntersectionObserver[] = [];

  let separatorEls: HTMLElement[] = [];
  const separatorStates = new Map<HTMLElement, SeparatorState>();

  let refreshSeparatorObservers = () => {};

  chatLogStyleState.subscribe(() => refreshSeparatorObservers());

  const updateSeparatorObservers = (callback: IntersectionObserverCallback) => {
    const commonOptions: IntersectionObserverInit = {
      root: scrollContentEl,
      threshold: 0,
    };

    const firstSeparatorObserver = new IntersectionObserver(callback, {...commonOptions, rootMargin: "-28px 0px 0px 0px"});
    const separatorsObserver = new IntersectionObserver(callback, {...commonOptions, rootMargin: "-36px 0px 0px 0px"});

    const observeAll = () => separatorEls.forEach((el, i) => (i === 0 ? firstSeparatorObserver : separatorsObserver).observe(el));

    refreshSeparatorObservers = () => {
      firstSeparatorObserver.disconnect();
      separatorsObserver.disconnect();
      observeAll();
    };

    observeAll();
    
    separatorObservers.forEach(observer => observer.disconnect());
    separatorObservers = [firstSeparatorObserver, separatorsObserver];
  };

  const updateDateSeperators = () => {
    if (!scrollContentEl?.firstElementChild?.firstElementChild) return;

    const logEls = [...scrollContentEl.firstElementChild.firstElementChild.children] as HTMLElement[];

    separatorEls = logEls.filter((el) => {
      return !el.querySelector('.message__timestamp,.message-author__username') && el.textContent;
    });

    // Return if no separators found
    if (!separatorEls.length) return;

    // Add footer to separator elements list
    separatorEls.push(logEls[logEls.length - 1]);

    separatorStates.clear();
    separatorEls.forEach((el, i) => separatorStates.set(el, {index: i, isIntersecting: false}));

    const maxIndex = separatorEls.length - 1;

    let innerTopIndex = maxIndex;

    const updateCurrentDateText: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const state = separatorStates.get(entry.target as HTMLElement);
        if (!entry.rootBounds || !state) return;

        state.isIntersecting = entry.isIntersecting;

        // Find the first intersecting separator element
        const newInnerTopIndex = separatorEls.findIndex(el => separatorStates.get(el)?.isIntersecting);
        innerTopIndex = newInnerTopIndex !== -1 ? newInnerTopIndex : maxIndex;

        // Case 1: The separator element rises above the root element and is hidden due to scrolling down
        if (entry.boundingClientRect.top < entry.rootBounds.top && !entry.isIntersecting) {
          if (!currentDateSeparator || state.index >= currentDateSeparator.index) {
            if (state.index < maxIndex) {
              currentDateSeparator = {
                index: state.index,
                element: separatorEls[state.index]
              };
            }
          }
        } else if (entry.isIntersecting) { // Case 2: A separator element appears while descending from the root element due to upward scrolling
          if (state.index <= innerTopIndex) {
            innerTopIndex = state.index;
            currentDateSeparator = (state.index - 1) >= 0 ? {
                index: state.index - 1,
                element: separatorEls[state.index - 1]
            } : null;
          }
        }
      });
    };

    updateSeparatorObservers(updateCurrentDateText);
  };

  const logObserver = new MutationObserver(updateDateSeperators);


  const handlePageRefresh = () => {
    if (document.contains(scrollContentEl)) return;

    if (scrollContentEl) {
      scrollContentEl.removeEventListener('scroll', scrollListener);
      separatorObservers.forEach(observer => observer.disconnect());
      logObserver.disconnect();
      scrollContentEl = null;
      currentDateSeparator = null;
    }

    scrollContentEl = modLogsPageEl.querySelector<HTMLElement>(".simplebar-scroll-content");
    if (scrollContentEl) {
      scrollContentEl.addEventListener('scroll', scrollListener);

      scrollContentEl.firstElementChild?.firstElementChild && 
      logObserver.observe(scrollContentEl.firstElementChild.firstElementChild, { childList: true });
      updateDateSeperators();

    } else {
      hideDateHeader();
    }
  };

  new MutationObserver(handlePageRefresh).observe(modLogsPageEl, { childList: true });
  handlePageRefresh();


  

  const handleClick = () => {
    if (!scrollContentEl || !currentDateSeparator) return;

    const headerOffset = 4;
    const elementPosition = currentDateSeparator.element.offsetTop - headerOffset;

    scrollContentEl.scrollTo({
      top: elementPosition,
    });
  };

  const handleMouseenter = () => {
    debouncedHideDateHeader.cancel();
    showDateHeader();
  };

  const handleMouseleave = () => {
    debouncedHideDateHeader();
  };

</script>

{#if isVisible && currentDateSeparator}
  <div class="absolute w-full h-0 mt-[0.3rem] z-10" in:fade={{duration: 200, easing: sineInOut}} out:fade={{duration: 300}}>
    <div id="tcn-dateHeader-wrapper" class="mx-auto w-fit">
      <button id="tcn-dateHeader-btn" class="daisy-btn min-h-[2.2rem] h-[2.2rem] font-normal no-animation"
        on:click={handleClick}
        on:mouseenter={handleMouseenter}
        on:mouseleave={handleMouseleave}
      > 
          {currentDateSeparator.element.textContent || ''}
      </button>
    </div>
  </div>
{/if}


<style>
  #tcn-dateHeader-wrapper {
    background-color: var(--color-background-overlay-alt);
    color: var(--color-text-overlay);
  }

  #tcn-dateHeader-wrapper {
    background-color: var(--color-background-overlay-alt);
    color: var(--color-text-overlay);
  }

  #tcn-dateHeader-btn {
    border-width: 0px;
    border-radius: var(--border-radius-medium);
    font-size: var(--button-text-default);
    font-family: inherit;

    background-color: var(--color-background-button-overlay-text-default);
    color: var(--color-text-button-overlay-text);
  }

  #tcn-dateHeader-btn:hover {
    background-color: var(--color-background-button-overlay-text-hover);
  }

  #tcn-dateHeader-btn:active {
    background-color: var(--color-background-button-overlay-text-active);
  }

</style>