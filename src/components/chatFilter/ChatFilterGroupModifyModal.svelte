<script lang="ts">
  import { i18n } from "src/i18n";
  import type { ChatFilterGroup } from "./types";
  import { createEventDispatcher, onMount } from "svelte";
  import type { Alert, DaisyUiModalElement } from "../types";
  import Fa from "svelte-fa";
  import { faXmark } from "@fortawesome/free-solid-svg-icons";
  import { isGroupListOpenStore } from "./stores";
  import { isAlphaNumericUnderscore } from "src/util/isAlphaNumericUnderscore";
  import ToastAlert from "../ToastAlert.svelte";

  interface Events {
    'create': ChatFilterGroup;
    'modify': ChatFilterGroup;
  }

  const dispatch = createEventDispatcher<Events>();

  let initialFilterGroup: ChatFilterGroup | null = null;

  let groupName: string = '';
  let isGlobal: boolean = true;
  let channelIds: Set<string> = new Set();

  let alertMessage: (alert: Alert) => void;

  export const openModal = (filterGroup: ChatFilterGroup | null) => {
    initialFilterGroup = filterGroup;

    groupName = filterGroup?.name ?? '';
    isGlobal = filterGroup?.isGlobal ?? true;
    channelIds = new Set(filterGroup?.channelIds);
    isChannelIdsEditActive = false;

    modalEl.showModal();
    $isGroupListOpenStore = true;
  };

  let channelId: string = '';

  let isChannelIdsEditActive: boolean = false;

  let modalEl: DaisyUiModalElement;

  const addChannelId = () => {
    channelId = channelId.trim();
    channelId = channelId.replace(/\s/g,'');
    if (!channelId) return;
    if (!isAlphaNumericUnderscore(channelId)) {
      alertMessage({ message: $i18n.t('warning.invalidUsernameFormat', { ns: 'optionApp' }), level: 'warning' });
      channelId = '';
      return;
    }

    channelIds = channelIds.add(channelId);
    channelId = '';
  };

  const deleteChannelId = (id: string) => {
    channelIds.delete(id);
    channelIds = channelIds;
  };

  const clearChannelIds = () => {
    channelIds.clear();
    channelIds = channelIds;
  };

  const submitGroup = () => {
    groupName = groupName.trim();
    if (!groupName) return;

    const chatFilterGroup: ChatFilterGroup = {
      id: initialFilterGroup?.id ?? window.crypto.randomUUID(),
      name: groupName,
      modifiedAt: Date.now(),
      filterCount: initialFilterGroup?.filterCount ?? 0,
      isActive: initialFilterGroup?.isActive ?? true,
      isGlobal,
      channelIds: [...channelIds],
    };

    if (initialFilterGroup) {
      dispatch('modify', chatFilterGroup);
    } else {
      dispatch('create', chatFilterGroup);
    }
    closeModal();
  };

  const closeModal = () => {
    modalEl.close();
  };

  $: if (!channelIds.size) {
    isChannelIdsEditActive = false;
  }

</script>

<dialog bind:this={modalEl} class="modal" >
  <div class="modal-box flex flex-col overflow-hidden">
    <h3 class="font-bold text-lg mb-1.5">
      {$i18n.t(initialFilterGroup ? 'editFilterGroup' : 'newFilterGroup', {ns: 'optionApp'})}
    </h3>

    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={closeModal}
    >✕</button>

    <div class="grow shrink min-h-0" data-simplebar>
      <div class="flex flex-col gap-2 p-1">
        <div class="form-control w-full ">
          <label for="group-name-input" class="label">
            <span class="label-text">{$i18n.t('groupName')}</span>
          </label>
          <input id="group-name-input" type="text" class="input input-sm input-bordered" 
            bind:value={groupName} 
          />
        </div>

        <div class="form-control w-full">
          <label for={null} class="label">
            <span class="label-text">{$i18n.t('chatFilterGroup.appliedChannels', {ns: 'optionApp'})}</span>
          </label>
          <div class="flex gap-10">
            <div class="form-control">
              <label class="label cursor-pointer gap-2">
                <input type="radio" class="radio max-md:radio-sm" value={true} bind:group={isGlobal} />
                <span class="label-text">{$i18n.t('allChannels')}</span> 
              </label>
            </div>
            <div class="form-control">
              <label class="label cursor-pointer gap-2">
                <input type="radio" class="radio max-md:radio-sm" value={false} bind:group={isGlobal} />
                <span class="label-text">{$i18n.t('selectedChannels')}</span> 
              </label>
            </div>
          </div>
        </div>
  
        {#if !isGlobal}
          <div class="flex justify-between gap-1">
            {#if isChannelIdsEditActive}
              <button class="btn btn-sm btn-error" on:click={clearChannelIds}>{$i18n.t('deleteAll')}</button>
            {:else}
              <form class="join shrink min-w-0" on:submit|preventDefault={addChannelId}>
                <input type="text" class="input input-sm input-bordered join-item min-w-0 shrink grow"
                  placeholder={$i18n.t('chatFilterGroup.username', { ns: 'optionApp' })}
                  bind:value={channelId} 
                />
                <button class="btn btn-sm join-item"
                  disabled={!channelId}
                >
                  {$i18n.t('add')}
                </button>
              </form>
            {/if}
            
            <button class="btn btn-sm" 
              on:click={() => isChannelIdsEditActive = !isChannelIdsEditActive}
              disabled={!channelIds.size}
            >{$i18n.t(isChannelIdsEditActive ? 'complete' : 'edit')}</button>
          </div>
  
          {#if channelIds.size}
            <div class="flex flex-wrap w-full gap-2 mt-2">
              {#each channelIds as id (id)}
                <div class="badge badge-neutral gap-1.5 h-auto" >
                  <span class="break-all">{id}</span>
                  {#if isChannelIdsEditActive}
                    <button title={$i18n.t('delete')} on:click={() => deleteChannelId(id)}><Fa icon={faXmark} /></button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <div class="modal-action z-10">
      <button class="btn btn-sm" on:click={closeModal}>{$i18n.t('cancel')}</button>
      <button class="btn btn-sm btn-primary"
        on:click={submitGroup}
        disabled={!groupName}
      >{$i18n.t(initialFilterGroup ? 'save' : 'create')}</button>
    </div>
  </div>

  <ToastAlert bind:alertMessage maxAlertCount={1} />
</dialog>