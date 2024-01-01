<script lang="ts">
    import { i18n } from "src/i18n";
    import { createEventDispatcher } from "svelte";
    import type { DaisyUiModalElement } from "../types";
    import { filterGroupsStore, isGroupListOpenStore } from "./stores";
    import type { ChatFilterGroup } from "./types";
    import { each } from "lodash";
  
    interface Events {
      'delete': string[];
    }
  
    const dispatch = createEventDispatcher<Events>();
        
    let modalEl: DaisyUiModalElement;

    let deletedFilterGroupIds: string[] = [];

    let deletedGroup: ChatFilterGroup | undefined;
  
    export const openModal = (groupIds: string[]) => {
      if (!groupIds.length) return;
      deletedFilterGroupIds = groupIds;
      deletedGroup = $filterGroupsStore[groupIds[0]];
      modalEl.showModal();
      $isGroupListOpenStore = true;
    };
  
    const deleteGroups = () => {
      dispatch('delete', deletedFilterGroupIds);
      closeModal();
    };
  
    const closeModal = () => {
      modalEl.close();
    };
  
  </script>
  
  <dialog bind:this={modalEl} class="modal">
    <div class="modal-box flex flex-col overflow-hidden">
      <h3 class="font-bold text-lg mb-3">
        {$i18n.t('deleteFilterGroup', {ns: 'optionApp'})}
      </h3>

      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        on:click={closeModal}
      >✕</button>

      <div class="grow shrink min-h-0 text-sm" data-simplebar>
        <div>
          {#if deletedFilterGroupIds.length === 1 && deletedGroup}
            <div class="flex flex-col gap-1">
              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('groupName')}:</span> 
                <span class="break-all">{deletedGroup.name}</span>
              </div>

              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('chatFilterGroup.appliedChannels', {ns: 'optionApp'})}:</span> 
                <span class="break-all">
                  {$i18n.t(deletedGroup.isGlobal ? 'allChannels' : 'selectedChannels')}
                  {#if !deletedGroup.isGlobal && deletedGroup.channelIds?.length}
                    (
                      {deletedGroup.channelIds.slice(0, 10).join(', ')}
                      {#if deletedGroup.channelIds.length > 10} , ... {/if}
                    )
                  {/if}
                </span>
              </div>

              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('filterCount')}:</span> 
                <span class="break-all">{deletedGroup.filterCount}</span>
              </div>

              <div class="flex gap-1">
                <span class="font-semibold shrink-0">{$i18n.t('modifiedAt')}:</span> 
                <span>
                  {new Date(deletedGroup.modifiedAt).toLocaleDateString()}
                  {new Date(deletedGroup.modifiedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          {:else if deletedFilterGroupIds.length > 1}
            <div>{$i18n.t('askIfDeleteFilterGroups', { count: deletedFilterGroupIds.length, ns: 'optionApp' })}</div>
          {/if}
        </div>
      </div>

      <div class="modal-action z-10">
        <button class="btn btn-sm" on:click={closeModal}>{$i18n.t('cancel')}</button>
        <button class="btn btn-sm btn-error"
          on:click={deleteGroups}
        >{$i18n.t('delete')}</button>
      </div>
    </div>
  </dialog>