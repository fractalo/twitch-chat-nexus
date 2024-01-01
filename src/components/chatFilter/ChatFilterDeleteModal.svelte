<script lang="ts">
    import { i18n } from "src/i18n";
    import { createEventDispatcher } from "svelte";
    import type { DaisyUiModalElement } from "../types";
    import type { ChatFilter } from "./types";
  import { getBadgeTitle, globalChatBadgesStore } from "./stores";
  
    interface Events {
      'delete': ChatFilter[];
    }
  
    const dispatch = createEventDispatcher<Events>();
        
    let modalEl: DaisyUiModalElement;

    let deletedFilters: ChatFilter[] = [];
  
    export const openModal = (filters: ChatFilter[]) => {
      if (!filters.length) return;
      deletedFilters = filters;
      modalEl.showModal();
    };
  
    const deleteFilters = () => {
      dispatch('delete', deletedFilters);
      closeModal();
    };
  
    const closeModal = () => {
      modalEl.close();
    };
  
</script>
  
<dialog bind:this={modalEl} class="modal">
  <div class="modal-box flex flex-col overflow-hidden">
    <h3 class="font-bold text-lg mb-3">
      {$i18n.t('deleteChatFilter', {ns: 'optionApp'})}
    </h3>

    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={closeModal}
    >✕</button>

    <div class="grow shrink min-h-0 text-sm" data-simplebar>
      <div>
        {#if deletedFilters.length === 1}
          <div class="flex flex-col gap-1">
            <div class="flex gap-1">
              <span class="font-semibold shrink-0">{$i18n.t('category')}:</span> 
              <span class="break-all">{$i18n.t(deletedFilters[0].type)}</span>
            </div>
            <div class="flex gap-1">
              <span class="font-semibold shrink-0">{$i18n.t('filterType')}:</span> 
              <span>{$i18n.t(deletedFilters[0].isIncluded ? 'include' : 'exclude')}</span>
            </div>

            {#if deletedFilters[0].type === 'username'}
              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('username')}:</span> 
                <span class="break-all">{deletedFilters[0].username}</span>
              </div>
              {#if deletedFilters[0].description}
                <div class="flex gap-1">
                  <span class="font-semibold shrink-0">{$i18n.t('description')}:</span> 
                  <span class="break-all">{deletedFilters[0].description}</span>
                </div>
              {/if}
            {:else if deletedFilters[0].type === 'keyword'}
              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('keyword')}:</span> 
                <span class="break-all">{deletedFilters[0].keyword}</span>
              </div>
            {:else if deletedFilters[0].type === 'badge'}
              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('badge')}:</span> 
                <span class="break-all">
                  {$i18n.t(`chatBadge.${deletedFilters[0].setId}.set`, {
                    ns: 'optionApp',
                    defaultValue: getBadgeTitle($globalChatBadgesStore[deletedFilters[0].setId]) ?? deletedFilters[0].setId
                  })}
                </span>
              </div>
            {/if}

            <div class="flex gap-1">
              <span class="font-semibold shrink-0">{$i18n.t('modifiedAt')}:</span> 
              <span>{new Date(deletedFilters[0].modifiedAt).toLocaleDateString()}</span>
              <span>{new Date(deletedFilters[0].modifiedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        {:else if deletedFilters.length > 1}
          <div>{$i18n.t('askIfDeleteChatFilters', { count: deletedFilters.length, ns: 'optionApp' })}</div>
        {/if}
      </div>
    </div>

    <div class="modal-action">
      <button class="btn btn-sm" on:click={closeModal}>{$i18n.t('cancel')}</button>
      <button class="btn btn-sm btn-error"
        on:click={deleteFilters}
      >{$i18n.t('delete')}</button>
    </div>
  </div>
</dialog>