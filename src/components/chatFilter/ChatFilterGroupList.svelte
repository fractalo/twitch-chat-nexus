<script lang="ts">
  import { i18n } from "src/i18n";
  import { CHAT_FILTER_TYPES, exportChatFilterGroups, removeChatFilterLists, setChatFilterGroups, setChatFilterList } from "./utils";
  import type { ChatFilterGroup, ChatFilterGroups, ChatFilterListMap, ImportedChatFilterGroup } from "./types";
  import TooltipButton from "../tooltip/TooltipButton.svelte";
  import Fa from 'svelte-fa';
  import { faArrowRight, faArrowRotateRight, faArrowUpFromBracket, faEllipsisVertical, faFileExport, faFileImport, faFilter, faMagnifyingGlass, faPen, faPlus, faToggleOff, faToggleOn, faTrash, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
  import ChatFilterGroupModifyModal from "./ChatFilterGroupModifyModal.svelte";
  import ChatFilterGroupDeleteModal from './ChatFilterGroupDeleteModal.svelte';
  import { afterUpdate, createEventDispatcher, onDestroy, onMount, tick } from "svelte";
  import { workingFilterGroupIdStore, filterGroupsStore } from "./stores";
  import Fuse from 'fuse.js'
  import ChatFilterGroupImportModal from "./ChatFilterGroupImportModal.svelte";
  import DropdownMenu from "../dropdown/DropdownMenu.svelte";
  import type { Alert } from "../types";
  import CloseIcon from '../icons/close.svelte';
  import DropdownFilter from "../dropdown/DropdownFilter.svelte";
  import RadioFilterButtonGroup from "../button/RadioFilterButtonGroup.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import Portal from "svelte-portal";

  interface Events {
    'click:group': null;
    'alert': Alert;
  }

  const dispatch = createEventDispatcher<Events>();

  let chatFilterGroupList: ChatFilterGroup[] = [];

  let rawChatFilterGroupList: ChatFilterGroup[] = [];
  let fuse: Fuse<ChatFilterGroup> | undefined;

  $: {
    rawChatFilterGroupList = Object.values($filterGroupsStore);
    fuse = new Fuse([...rawChatFilterGroupList], { 
      keys: ["name", "channelIds"]
    });
    updateFilterGroupList();
  }

  let searchPattern: string = '';

  let isEditMode: boolean = false;

  let selectedGroupIds: string[] = [];

  let newChatFilterGroupIds: Set<string> = new Set();

  $: isNoneSelectedActive = selectedGroupIds.every(id => !$filterGroupsStore[id].isActive);

  const toggleEditMode = () => {
    isEditMode = !isEditMode;
    selectedGroupIds = [];
  };

  const toggleAllEditCheckbox = () => {
    if (selectedGroupIds.length) {
      selectedGroupIds = [];
    } else {
      selectedGroupIds = chatFilterGroupList.map(group => group.id);
    }
  };

  const toggleActiveSelected = () => {
    selectedGroupIds.forEach(id => $filterGroupsStore[id].isActive = isNoneSelectedActive);
    handleChange();
  };

  const updateSelectedGroupIds = () => {
    const groupIds = new Set(chatFilterGroupList.map(group => group.id));
    selectedGroupIds = selectedGroupIds.filter(id => groupIds.has(id));
  };

  const searchList = (pattern: string) => {
    return fuse?.search(pattern).map(result => result.item) ?? [];
  };

  const searchOrSortList = () => {
    if (searchPattern) {
      return searchList(searchPattern);
    } else {
      return rawChatFilterGroupList.sort(compareFuncs[sortBy]);
    }
  };

  const filterList = (list: ChatFilterGroup[]) => {
    return list.filter(group => {
      if (filterByActive !== null && filterByActive !== group.isActive) return false;
      if (filterByGlobal !== null && filterByGlobal !== group.isGlobal) return false;
      return true;
    });
  };

  const updateFilterGroupList = () => {
    let searchedOrSortedList: ChatFilterGroup[];
    if (!$workingFilterGroupIdStore) {
      const sortedList = rawChatFilterGroupList.sort(compareFuncs[sortBy]);
      if (sortedList.length) {
        $workingFilterGroupIdStore = sortedList[0].id;
      }
      searchedOrSortedList = searchPattern ? searchList(searchPattern) : sortedList;
    } else {
      searchedOrSortedList = searchOrSortList();
    }
    chatFilterGroupList = filterList(searchedOrSortedList);
    updateSelectedGroupIds();
  };

  type CompareFunction = (a: ChatFilterGroup, b: ChatFilterGroup) => number;

  const compareFuncs = {
    lastModified(a, b) {
      return b.modifiedAt - a.modifiedAt;
    },
    name(a, b) {
      return a.name.localeCompare(b.name);
    },
    large(a, b) {
      return b.filterCount - a.filterCount;
    },
    
  } satisfies Record<string, CompareFunction>;

  type SortType = keyof typeof compareFuncs;

  const CHAT_FILTER_GROUP_SORTBY_STORAGE_KEY = 'chatFilterGroupList_sortBy';
  
  const DEFUALT_SORTBY: SortType = 'lastModified';

  const getStoredSortBy = (): SortType => {
    const value = localStorage.getItem(CHAT_FILTER_GROUP_SORTBY_STORAGE_KEY);
    if (!value) return DEFUALT_SORTBY;
    if (value in compareFuncs) {
      return value as SortType;
    }
    return DEFUALT_SORTBY;
  };

  const storeSortBy = (sortBy: SortType) => {
    localStorage.setItem(CHAT_FILTER_GROUP_SORTBY_STORAGE_KEY, sortBy);
  };

  let sortBy: SortType = getStoredSortBy();

  $: storeSortBy(sortBy);


  let filterByActive: boolean | null = null;
  let filterByGlobal: boolean | null = null;



  $: isListFilterActive = filterByActive !== null || filterByGlobal !== null;

  const clearListFilters = () => {
    filterByActive = null;
    filterByGlobal = null;
    updateFilterGroupList();
  };


  const clearSearchPattern = () => {
    searchPattern = '';
    updateFilterGroupList();
  };

  const handleChange = () => {
    setChatFilterGroups($filterGroupsStore);
  };

  const setNewChatFilterGroup = (group: ChatFilterGroup) => {
    newChatFilterGroupIds = new Set([group.id]);
    $filterGroupsStore[group.id] = group;
    handleChange();
    $workingFilterGroupIdStore = group.id;
  };

  const setModifiedChatFilterGroup = (group: ChatFilterGroup) => {
    if (!(group.id in $filterGroupsStore)) {
      return dispatch('alert', { message: $i18n.t('warning.filterGroupNotExists', { ns: 'optionApp' }), level: 'warning' });
    }
    $filterGroupsStore[group.id] = group;
    handleChange();
  };

  const deleteChatFilterGroup = (groupIds: string[]) => {
    groupIds.forEach(id => delete $filterGroupsStore[id]);
    $filterGroupsStore = $filterGroupsStore;
    handleChange();
    groupIds.forEach(id => removeChatFilterLists(id));
  };

  const importChatFilterGroup = (importedGroups: ImportedChatFilterGroup[]) => {
    importedGroups.forEach(group => {
      if (group.id in $filterGroupsStore) {
        group.id = window.crypto.randomUUID();
      }

      const { filters } = group;

      $filterGroupsStore[group.id] = {
        id: group.id,
        name: group.name,
        modifiedAt: group.modifiedAt,
        filterCount: filters.length,
        isActive: group.isActive,
        isGlobal: group.isGlobal,
        channelIds: group.channelIds,
      };

      const filtersByType: ChatFilterListMap = {
        username: {},
        keyword: {},
        badge: {},
      };

      filters.forEach(filter => filtersByType[filter.type][filter.id] = filter);

      CHAT_FILTER_TYPES.forEach(type => setChatFilterList(group.id, type, filtersByType[type]));
    });

    handleChange();

    newChatFilterGroupIds = new Set(importedGroups.map(group => group.id));
  };

  let openFilterGroupModifyModal: (group: ChatFilterGroup | null) => void;

  const addChatFilterGroup = () => {
    openFilterGroupModifyModal(null);
  };

  const modifyChatFilterGroup = (group: ChatFilterGroup) => {
    openFilterGroupModifyModal(group);
  };

  let openFilterGroupDeleteModal: (groupIds: string[]) => void;

  let openFilterGroupImportModal: () => void;

  const handleClickFilterGroup = (group: ChatFilterGroup) => {
    $workingFilterGroupIdStore = group.id;
    dispatch('click:group');
  };


  let workingGroupEl: HTMLElement | undefined;

  const scrollIntoView = (node: HTMLElement) => {
    if (node.classList.contains('active')) {
      workingGroupEl = node;
    }
  };

  onMount(() => {
    setTimeout(() => workingGroupEl?.scrollIntoView(false), 0);
  });


</script>

<Portal target="body">
  <ChatFilterGroupModifyModal
    on:create={event => setNewChatFilterGroup(event.detail)}
    on:modify={event => setModifiedChatFilterGroup(event.detail)}
    bind:openModal={openFilterGroupModifyModal}
  />

  <ChatFilterGroupDeleteModal
    on:delete={event => deleteChatFilterGroup(event.detail)}
    bind:openModal={openFilterGroupDeleteModal}
  />

  <ChatFilterGroupImportModal
    on:import={event => importChatFilterGroup(event.detail)}
    bind:openModal={openFilterGroupImportModal}
  />
</Portal>



<div class="flex flex-col h-full gap-1">
  <div class="flex gap-1.5 w-full items-center">
    <div class="relative flex grow flex-shrink items-center min-w-0">
      <Fa class="absolute left-2.5 text-sm opacity-60" icon={faMagnifyingGlass} />
      <input type="text" 
        class="input input-sm grow flex-shrink min-w-0 px-8" 
        placeholder={$i18n.t('search')}
        bind:value={searchPattern}
        on:input={updateFilterGroupList}
      />
      {#if searchPattern}
        <button class="absolute btn btn-xs btn-ghost btn-circle right-1" 
          on:click={clearSearchPattern}
        >
          <Fa class="text-sm" icon={faXmark} />
        </button>
      {/if}
    </div>

    {#if !searchPattern}
      <div class="form-control">
        <select class="select select-sm" 
          bind:value={sortBy}
          on:change={updateFilterGroupList} 
        >
          {#each Object.keys(compareFuncs) as sortType }
            <option value={sortType}>{$i18n.t(`sortBy.${sortType}`, { ns: 'optionApp' })}</option>
          {/each}
        </select>
      </div>
    {/if}

    <DropdownFilter isActive={isListFilterActive} let:setIsOpen>
      <div class="flex flex-col gap-2.5 p-2">
        <div class="flex flex-col gap-1">
          <span class="text-sm font-semibold">{$i18n.t('status')}</span>
          <RadioFilterButtonGroup
            bind:value={filterByActive}
            onChange={updateFilterGroupList}
            items={[
              { value: true, label: $i18n.t('chatFilterGroup.enabled', {ns: 'optionApp'}) },
              { value: false, label: $i18n.t('chatFilterGroup.disabled', {ns: 'optionApp'}) }
            ]}
          />
        </div>
  
        <div class="flex flex-col gap-1">
          <span class="text-sm font-semibold">{$i18n.t('chatFilterGroup.appliedChannels', {ns: 'optionApp'})}</span>
          <RadioFilterButtonGroup
            bind:value={filterByGlobal}
            onChange={updateFilterGroupList}
            items={[
              { value: true, label: $i18n.t('chatFilterGroup.allChannels', {ns: 'optionApp'}) },
              { value: false, label: $i18n.t('chatFilterGroup.someChannels', {ns: 'optionApp'}) }
            ]}
          />
        </div>
      </div>
      
      <div class="flex justify-between">
        <button class="btn btn-sm btn-ghost" on:click={clearListFilters}>
          <Fa icon={faArrowRotateRight} class="text-sm" />
          {$i18n.t('reset')}
        </button>
        <button class="btn btn-sm btn-ghost" on:click={() => setIsOpen(false)}>
          {$i18n.t('close')}
        </button> 
      </div>
    </DropdownFilter>
  </div>

  {#if isEditMode}
    <div class="flex justify-between gap-1">
      <div class="flex gap-2 items-center ml-3">
        <Tooltip
          placement="bottom-start"
          text={$i18n.t(selectedGroupIds.length ? 'deselectAll' : 'selectAll')}
          let:tooltipRef
          let:setShowTooltip
        >
          <input type="checkbox" class="checkbox checkbox-sm"
            checked={Boolean(selectedGroupIds.length)}
            indeterminate={Boolean(selectedGroupIds.length) && selectedGroupIds.length !== chatFilterGroupList.length}
            on:change={toggleAllEditCheckbox}
            use:tooltipRef
            on:mouseenter={() => setShowTooltip(true)}
            on:mouseleave={() => setShowTooltip(false)}
          >
        </Tooltip>
        
        <span class="text-sm break-all">{$i18n.t('nSelected', { count: selectedGroupIds.length })}</span>
      </div>
      <div class="flex gap-1">
        <TooltipButton
          placement="bottom"
          label={$i18n.t(isNoneSelectedActive ? 'enable' : 'disable')}
          class="btn btn-sm btn-square"
          on:click={toggleActiveSelected}
          disabled={!selectedGroupIds.length}
        > 
          <Fa class="text-base" icon={isNoneSelectedActive ? faToggleOn : faToggleOff} />
        </TooltipButton>

        <TooltipButton
          placement="bottom"
          label={$i18n.t('delete')}
          class="btn btn-sm btn-square btn-error"
          on:click={() => openFilterGroupDeleteModal(selectedGroupIds)}
          disabled={!selectedGroupIds.length}
        > 
          <Fa class="text-base" icon={faTrashCan} />
        </TooltipButton>

      </div>
    </div>
  {/if}

  <div class="min-h-[4rem] grow shrink">
    <div class="h-full" data-simplebar>
      <ul class="menu menu-sm px-3">
        {#each chatFilterGroupList as filterGroup (filterGroup.id)}
          <div class="flex gap-1 w-full relative">
            {#if isEditMode}
              <label class="label flex-none cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-sm" 
                  value={filterGroup.id}
                  bind:group={selectedGroupIds}
                />
              </label>
            {/if}
            
            <li class="grow shrink min-w-0">
              <a class="gap-1 lg:gap-2 p-2.5 lg:p-4 cursor-pointer flex w-full" href={null}
                class:active={$workingFilterGroupIdStore === filterGroup.id}
                use:scrollIntoView
                on:click={(event) => !(event.target instanceof Element && (event.target.closest('.menu-tools') || !document.contains(event.target))) && handleClickFilterGroup(filterGroup)}
              >
                <div class="flex flex-col grow shrink min-w-0 gap-1" class:opacity-50={!filterGroup.isActive}>
                  <div class="text-base font-semibold break-all">
                    {filterGroup.name}
                  </div>
        
                  {#if filterGroup.isGlobal}
                    <div class="badge badge-success">{$i18n.t('allChannels')}</div>
                  {:else if filterGroup.channelIds && filterGroup.channelIds.length}
                    <div class="flex flex-wrap gap-1 ">
                      {#each filterGroup.channelIds.slice(0, 5) as channelId (channelId)}
                        <div class="badge badge-ghost min-w-0">
                          <span class="whitespace-nowrap overflow-hidden text-ellipsis">{channelId}</span>
                        </div>
                      {/each}
                      {#if filterGroup.channelIds.length > 5}
                        <div class="text-sm break-all">+{$i18n.t('nChannels', { count: filterGroup.channelIds.length - 5 })}</div>
                      {/if}
                    </div>
                  {:else}
                    <div class="badge badge-error">{$i18n.t('noSelectedChannels', {ns: 'optionApp'})}</div>
                  {/if}
  
                  <div class="text-sm">{$i18n.t('nFilters', { count: filterGroup.filterCount })}</div>
                </div>  
                
                <div class="flex flex-none items-center menu-tools" role="presentation">
                  <input type="checkbox" class="toggle toggle-sm toggle-primary"
                    bind:checked={filterGroup.isActive}
                    on:change={handleChange}
                  />
                  <DropdownMenu
                    items={[
                      {
                        handler: () => modifyChatFilterGroup(filterGroup),
                        text: $i18n.t('edit'),
                        icon: faPen
                      },
                      {
                        handler: () => exportChatFilterGroups([filterGroup]),
                        text: $i18n.t('export'),
                        icon: faFileExport
                      },
                      {
                        handler: () => openFilterGroupDeleteModal([filterGroup.id]),
                        text: $i18n.t('delete'),
                        icon: faTrash,
                        type: 'error',
                      },
                    ]}
                  />
                </div>
              </a>
            </li>

            {#if newChatFilterGroupIds.has(filterGroup.id)}
              <div class="badge badge-sm badge-secondary absolute top-1 right-1">{$i18n.t('new')}</div>
            {/if}
          </div>
        {/each}
        </ul>
    </div>
  </div>
  

  <div class="flex justify-between">
    <button class="btn btn-sm  "
      on:click={toggleEditMode}
    >
      {$i18n.t(isEditMode ? 'complete' : 'edit')}
    </button>

    <div class="flex flex-wrap gap-1 items-center">
      {#if !isEditMode}
        <button class="btn btn-sm "
          on:click={openFilterGroupImportModal}
        >
          <Fa class="text-base" icon={faFileImport} />
          {$i18n.t('import')}
        </button>

        <button class="btn btn-sm  "
          on:click={addChatFilterGroup}
        >
          <Fa class="text-base" icon={faPlus} />
          {$i18n.t('create')}
        </button>
      {:else}
        <button class="btn btn-sm "
          on:click={() => exportChatFilterGroups(selectedGroupIds.map(id => $filterGroupsStore[id]))}
          disabled={!selectedGroupIds.length}
        >
          <Fa class="text-base" icon={faFileExport} />
          {$i18n.t('export')}
        </button>
      {/if}
    </div>
  </div>
</div>
