<script lang="ts">
  import Navbar from "./Navbar.svelte";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import { pages } from "./pages";
  import { activePageStore } from './stores';
  import { crossfade } from "svelte/transition";
  import type { Page } from "./types";
  import { cubicOut } from "svelte/easing";

  export let isPopup = false;

  let page: Page | undefined;

  $: page = pages[$activePageStore];

  const [send, receive] = crossfade({duration: 250, easing: cubicOut });
</script>

<div
  class="flex flex-col bg-base-100
    {isPopup ? "w-[26rem] h-[28rem]" : "h-screen"}
  "
>
  <Navbar {isPopup} />
  <div class="grow w-full min-h-0 bg-base-100 flex">
    {#if page}
      <Sidebar />
        <div class="grow min-w-0 relative">
          {#key page}
            <div
              class="absolute w-full h-full"
              in:receive={{key: 'page'}}
              out:send={{key: 'page'}}
            >
              {#if page.useRootSimplebar}
                <div class="w-full h-full" data-simplebar>
                  <div>
                    <svelte:component this={page.component} {...page.props} />
                  </div>
                </div>
              {:else}
                <div class='w-full h-full'> 
                  <svelte:component this={page.component} {...page.props} />
                </div>
              {/if}
            </div>
          {/key}
        </div>
    {/if}
  </div>
</div>
