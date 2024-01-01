<script lang="ts">
  import { createEventDispatcher, onMount, tick } from "svelte";
  import type { Alert, DaisyUiModalElement } from "../types";
  import { i18n } from "src/i18n";
  import type { ImportedChatFilterGroup } from "./types";
  import { getValidImportedChatFilterGroups } from "./utils";
  import { isGroupListOpenStore } from "./stores";
  import ToastAlert from "../ToastAlert.svelte";
  import { isRecord, isUnknownArray } from "src/util/typePredicates";

  interface Events {
    'import': ImportedChatFilterGroup[];
  }

  const dispatch = createEventDispatcher<Events>();
      
  let modalEl: DaisyUiModalElement;
  let modalClearTimer: number | undefined;
  
  let files: FileList | undefined;
  let fileInputEl: HTMLInputElement | undefined;
  let reader: FileReader = new FileReader();

  let importedGroups: Record<string, ImportedChatFilterGroup> = {};
  let selectedGroupIds: string[] = [];

  let alertMessage: (alert: Alert) => void;

  const clearModal = () => {
    if (fileInputEl) {
      fileInputEl.value = '';
    }
    importedGroups = {};
    selectedGroupIds = [];
    reader.abort();
  };

  export const openModal = () => {
    window.clearTimeout(modalClearTimer);
    clearModal();
    modalEl.showModal();
    $isGroupListOpenStore = true;
  };

  const closeModal = () => {
    modalEl.close();
    clearTimeout(modalClearTimer);
    modalClearTimer = window.setTimeout(clearModal, 250);
  };

  const importGroups = () => {
    dispatch('import', selectedGroupIds.map(id => importedGroups[id]));
    closeModal();
  };

  const parseChatFilterGroups = (content: string) => {
    try {
      const data: unknown = JSON.parse(content);

      let dataArr: unknown[];
      if (isRecord(data)) {
        dataArr = Object.values(data);
      } else if (isUnknownArray(data)) {
        dataArr = data;
      } else {
        throw new Error($i18n.t('error.invalidDataFormat', { ns: 'optionApp' }));
      }

      const groups = getValidImportedChatFilterGroups(dataArr);

      if (!groups.length) {
        throw new Error($i18n.t('error.cannotReadAnyFilterGroups', { ns: 'optionApp' }));
      } else if (groups.length < dataArr.length) {
        throw new Error($i18n.t('error.cannotReadSomeFilterGroups', { ns: 'optionApp' }));
      }
      return groups;

    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof SyntaxError) {
          alertMessage({ message: $i18n.t('error.jsonParseError', { ns: 'optionApp' }), level: 'error' });
        } else {
          alertMessage({ message: error.message, level: 'error' });
        }
        clearModal();
      }
      console.error(error);
    }
  };

  const handleFileChange = () => {
    reader.abort();
    importedGroups = {};
    selectedGroupIds = [];
    if (!files?.length) return;

    const file = files[0];
    reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        return;
      }
      const groups = parseChatFilterGroups(reader.result);
      if (!groups) return;

      importedGroups = groups.reduce((record, group) => {
        record[group.id] = group;
        return record;
      }, {} as Record<string, ImportedChatFilterGroup>);
      
      selectedGroupIds = groups.map(group => group.id);
    });

    reader.addEventListener('error', () => {
      alertMessage({ message: $i18n.t('error.fileReadError'), level: 'error' });
      console.error(reader.error);
      clearModal();
    });

    reader.readAsText(file);
  };
  

</script>

<dialog bind:this={modalEl} class="modal">
  <div class="modal-box flex flex-col overflow-hidden">
    <h3 class="font-bold text-lg mb-1.5">
      {$i18n.t('importFilterGroup', {ns: 'optionApp'})}
    </h3>

    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={closeModal}
    >✕</button>

    <input type="file" accept=".json" class="file-input file-input-sm file-input-bordered w-full shrink-0 my-2" 
      bind:files={files}
      bind:this={fileInputEl}
      on:change={handleFileChange}
    />

    <div class="grow shrink min-h-0" data-simplebar>
      <div class="flex flex-col gap-2.5">
        {#each Object.values(importedGroups) as group (group.id)}
          <div class="flex items-center gap-2">
            <label class="label flex-none cursor-pointer">
              <input type="checkbox" class="checkbox checkbox-sm" 
                value={group.id}
                bind:group={selectedGroupIds}
              />
            </label>
            
            <div class="flex flex-col">
              <div class="text-sm font-semibold break-all">
                {group.name}
              </div>
              
              {#if group.isGlobal}
                <div class="badge badge-success badge-sm">{$i18n.t('allChannels')}</div>
              {:else if group.channelIds && group.channelIds.length}
                <div class="flex flex-wrap gap-1">
                  {#each group.channelIds.slice(0, 5) as channelId (channelId)}
                    <div class="badge badge-neutral badge-sm">{channelId}</div>
                  {/each}
                  {#if group.channelIds.length > 5}
                    <div class="break-all">+{$i18n.t('nChannels', { count: group.channelIds.length - 5 })}</div>
                  {/if}
                </div>
              {:else}
                <div class="badge badge-error badge-sm">{$i18n.t('noActiveChannels', {ns: 'optionApp'})}</div>
              {/if}
              
              <div>{$i18n.t('nFilters', { count: group.filters.length })}</div>

              <div class="flex gap-1">
                <span>{new Date(group.modifiedAt).toLocaleDateString()}</span>
                <span>{new Date(group.modifiedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="modal-action z-10">
      <button class="btn btn-sm" on:click={closeModal}>{$i18n.t('cancel')}</button>
      <button class="btn btn-sm btn-primary"
        on:click={importGroups}
        disabled={!selectedGroupIds.length}
      >{$i18n.t('import')}</button>
    </div>
  </div>

  <ToastAlert bind:alertMessage />
</dialog>