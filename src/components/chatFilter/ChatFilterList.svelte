<script lang="ts">
  import { onDestroy, createEventDispatcher, onMount } from "svelte";
  import { filterGroupsStore, getBadgeFirstVersion, getBadgeTitle, globalChatBadgesStore, workingFilterGroupIdStore } from "./stores";
  import type { BadgeFilter, ChatFilter, ChatFilterGroup, ChatFilterListMap, ChatFilterType, KeywordFilter, UsernameFilter } from "./types";
  import { CHAT_FILTERS_KEY_PREFIX, CHAT_FILTER_TYPES, SUBSCRIBER_BADGE_TYPE, getChatFilterList, setChatFilterGroups, setChatFilterList } from "./utils";
  import { faArrowRotateRight, faFilter, faMagnifyingGlass, faMinus, faPen, faPlus, faToggleOff, faToggleOn, faTrash, faTrashCan, faXmark, } from "@fortawesome/free-solid-svg-icons";
  import { faSquareMinus, faSquarePlus } from "@fortawesome/free-regular-svg-icons";
  import { i18n } from "src/i18n";
  import Fa from "svelte-fa";
  import ChatFilterModifyModal from "./ChatFilterModifyModal.svelte";
  import { isObjectOwnKey, isRecord } from "src/util/typePredicates";
  import Fuse from "fuse.js";
  import ChatFilterDeleteModal from "./ChatFilterDeleteModal.svelte";
  import DropdownMenu from "../dropdown/DropdownMenu.svelte";
  import type { Unsubscribe } from "nanoevents";
  import type { Alert } from "../types";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import DropdownFilter from "../dropdown/DropdownFilter.svelte";
  import RadioFilterButtonGroup from "../button/RadioFilterButtonGroup.svelte";
  import TooltipButton from "../tooltip/TooltipButton.svelte";
  import { RANGE_SELECTABLE_BADGES } from "./chatBadges";
  import Portal from "svelte-portal";
  import SimpleBar from "simplebar";

  interface Events {
    'alert': Alert;
  }

  const dispatch = createEventDispatcher<Events>();

  const unsubscribers: Unsubscribe[] = [];

  let chatFilterGroup: ChatFilterGroup | null | undefined;

  let isEditMode: boolean = false;

  let chatFilterList: ChatFilter[] = [];

  let allChatFilterList: ChatFilter[] = [];

  const chatFilterListByType: Record<ChatFilterType, ChatFilter[]> = {
    username: [],
    keyword: [],
    badge: [],
  };

  let filtersByType: ChatFilterListMap = {
    username: {},
    keyword: {},
    badge: {},
  };

  let rawChatFilterList: ChatFilter[] = [];
  let fuse: Fuse<ChatFilter> | undefined;
  
  $: {
    rawChatFilterList = Object.values(filtersByType).reduce((list, filterList) => {
      list.push(...Object.values(filterList));
      return list;
    }, [] as ChatFilter[]);

    fuse = new Fuse([...rawChatFilterList], { 
      keys: ["username", "description", "keyword", "setId"],
    });

    updateFilterList();
  }

  let listContainerEl: HTMLElement | undefined;
  let listScrollEl: HTMLElement | null = null;

  $: if (listContainerEl) {
    let simpleBar = new SimpleBar(listContainerEl, { autoHide: false });
    listScrollEl = simpleBar.getScrollElement();
  }

  $: {
    chatFilterList = activeListTab === 'all' ? allChatFilterList : chatFilterListByType[activeListTab];
    updateSelectedFilters();
  }

  const getTotalFilterCount = () => {
    return Object.values(filtersByType).reduce((count, filters) => {
      return count + Object.keys(filters).length;
    }, 0);
  }

  const handleStorageChange: Parameters<typeof chrome.storage.local.onChanged.addListener>[0] = (changes) => {
    Object.entries(changes).forEach(([key, { newValue }]) => {
      const keySegments = key.split('.');
      if (keySegments.length !== 3) return;
      const [ prefix, groupId, category ] = keySegments;
      if (
        prefix === CHAT_FILTERS_KEY_PREFIX &&
        groupId === chatFilterGroup?.id &&
        isObjectOwnKey(filtersByType, category)
      ) {
        // When a filter group is deleted, the belonging filter list storage key is deleted, so newValue may be undefined at this time.
        filtersByType[category] = isRecord(newValue) ? newValue as Record<string, any> : {};
      }
    });
  };

  chrome.storage.local.onChanged.addListener(handleStorageChange);


  const updateFiltersByType = (groupId: string) => {
    Promise.all([
      getChatFilterList(groupId, 'username'),
      getChatFilterList(groupId, 'keyword'),
      getChatFilterList(groupId, 'badge'),
    ])
    .then(([usernameFilters, keywordFilters, badgeFilters]) => {
      filtersByType = {
        username: usernameFilters,
        keyword: keywordFilters,
        badge: badgeFilters,
      };
    });
  };

  const clearFiltersByType = () => {
    CHAT_FILTER_TYPES.forEach(type => filtersByType[type] = {});
  };
  

  let searchPattern: string = '';

  type SelectedFilterId = `${ChatFilterType}|${string}`;

  let selectedFilterIds: SelectedFilterId[] = [];

  let selectedFilters: ChatFilter[] = [];

  $: selectedFilters = selectedFilterIds.map(selected => {
    const [ type, id ] = selected.split('|');
    return filtersByType[type as ChatFilterType][id];
  });

  $: isNoneSelectedActive = selectedFilters.every(filter => !filter.isActive);

  const toggleEditMode = () => {
    isEditMode = !isEditMode;
    selectedFilterIds = [];
  };

  const toggleAllEditCheckbox = () => {
    if (selectedFilterIds.length) {
      selectedFilterIds = [];
    } else {
      selectedFilterIds = chatFilterList.map<SelectedFilterId>(filter => `${filter.type}|${filter.id}`);
    }
  };

  const toggleActiveSelected = () => {
    selectedFilters.forEach(filter => filter.isActive = isNoneSelectedActive);
    handleChange([...new Set(selectedFilters.map(filter => filter.type))]);
  };

  const updateSelectedFilters = () => {
    const filterIds = new Set(chatFilterList.map(filter => filter.id));
    selectedFilterIds = selectedFilterIds.filter(selected => {
      const [ type, id ] = selected.split('|');
      return filterIds.has(id);
    });
  };

  const searchOrSortList = () => {
    if (searchPattern) {
      return fuse?.search(searchPattern).map(result => result.item) ?? [];
    } else {
      return rawChatFilterList.sort(compareFuncs[sortBy]);
    }
  };

  const filterList = (list: ChatFilter[]) => {
    return list.filter(filter => {
      if (filterByActive !== null && filterByActive !== filter.isActive) return false;
      if (filterByInclude !== null && filterByInclude !== filter.isIncluded) return false;
      return true;
    });
  };

  const updateFilterList = () => {
    allChatFilterList = filterList(searchOrSortList());

    Object.keys(chatFilterListByType).forEach(type => chatFilterListByType[type as ChatFilterType] = []);
    allChatFilterList.forEach(chatFilter => chatFilterListByType[chatFilter.type].push(chatFilter));
  };

  const clearSearchPattern = () => {
    searchPattern = '';
    updateFilterList();
  };

  type CompareFunction = (a: ChatFilter, b: ChatFilter) => number;

  const compareFuncs = {
    lastModified(a, b) {
      return b.modifiedAt - a.modifiedAt;
    },
    name(a, b) {
      if (a.type === 'username' && b.type === 'username') {
        return a.username.localeCompare(b.username);
      } else if (a.type === 'keyword' && b.type === 'keyword') {
        return a.keyword.localeCompare(b.keyword);
      } else if (a.type === 'badge' && b.type === 'badge') {
        return $i18n.t(a.setId).localeCompare($i18n.t(b.setId));
      } else {
        return b.type.localeCompare(a.type);
      }
    },
  } satisfies Record<string, CompareFunction>;

  type SortType = keyof typeof compareFuncs;

  const CHAT_FILTER_SORTBY_STORAGE_KEY = 'chatFilterList_sortBy';
  
  const DEFUALT_SORTBY: SortType = 'lastModified';

  const getStoredSortBy = (): SortType => {
    const value = localStorage.getItem(CHAT_FILTER_SORTBY_STORAGE_KEY);
    if (!value) return DEFUALT_SORTBY;
    if (value in compareFuncs) {
      return value as SortType;
    }
    return DEFUALT_SORTBY;
  };

  const storeSortBy = (sortBy: SortType) => {
    localStorage.setItem(CHAT_FILTER_SORTBY_STORAGE_KEY, sortBy);
  };


  let sortBy: SortType = getStoredSortBy();

  $: storeSortBy(sortBy);

  let filterByActive: boolean | null = null;
  let filterByInclude: boolean | null = null;

  $: isListFilterActive = filterByActive !== null || filterByInclude !== null;

  const clearListFilters = () => {
    filterByActive = null;
    filterByInclude = null;
    updateFilterList();
  };

  type ChatFilterListTabType = 'all' | ChatFilterType;

  let activeListTab: ChatFilterListTabType = 'all';

  const listTabs: ChatFilterListTabType[] = ['all', ...CHAT_FILTER_TYPES];

  const handleClickTab = (tab: ChatFilterListTabType) => {
    activeListTab = tab;
    listScrollEl?.scrollTo(0, 0);
  };

  const handleChange = (types: ChatFilterType[]) => {
    const groupId = chatFilterGroup?.id;
    if (!groupId) return;

    types.forEach(type => setChatFilterList(groupId, type, filtersByType[type]));

    $filterGroupsStore[groupId].filterCount = getTotalFilterCount();
    $filterGroupsStore[groupId].modifiedAt = Date.now();
    setChatFilterGroups($filterGroupsStore);
  };

  const setNewChatFilter = (filter: ChatFilter) => {
    filtersByType[filter.type][filter.id] = filter;
    handleChange([filter.type]);
  };

  const setModifiedChatFilter = (filter: ChatFilter) => {
    if (!(filter.id in filtersByType[filter.type])) {
      return dispatch('alert', { message: $i18n.t('warning.chatFilterNotExists', { ns: 'optionApp' }), level: 'warning' });;
    }
    filtersByType[filter.type][filter.id] = filter;
    handleChange([filter.type]);
  };

  const addChatFilter = () => {
    openFilterModifyModal(activeListTab === 'all' ? null : activeListTab);
  };

  const modifyChatFilter = (filter: ChatFilter) => {
    openFilterModifyModal(filter);
  };

  const deleteChatFilter = (filters: ChatFilter[]) => {
    filters.forEach(filter => delete filtersByType[filter.type][filter.id]);

    handleChange([...new Set(filters.map(filter => filter.type))]);
  };

  let openFilterModifyModal: (filter: ChatFilter | ChatFilterType | null) => void;

  let openFilterDeleteModal: (filters: ChatFilter[]) => void;

  unsubscribers.push(
    workingFilterGroupIdStore.subscribe(workingGroupId => {
      isEditMode = false;
      clearFiltersByType();

      chatFilterGroup = workingGroupId ? $filterGroupsStore[workingGroupId] : null;

      if (!chatFilterGroup) return;

      updateFiltersByType(chatFilterGroup.id);
    }),
  );


  onDestroy(() => {
    chrome.storage.local.onChanged.removeListener(handleStorageChange);
    unsubscribers.forEach(unbind => unbind());
  });



</script>


<Portal target="body">
  <ChatFilterModifyModal
    on:create={event => setNewChatFilter(event.detail)}
    on:modify={event => setModifiedChatFilter(event.detail)}
    bind:openModal={openFilterModifyModal}
  />

  <ChatFilterDeleteModal
    on:delete={event => deleteChatFilter(event.detail)}
    bind:openModal={openFilterDeleteModal}
  />
</Portal>


{#if chatFilterGroup}
<div class="flex flex-col h-full">
  <div class="flex gap-1.5 w-full items-center">
    <div class="relative flex grow flex-shrink items-center min-w-0">
      <Fa class="absolute left-2.5 text-sm opacity-60" icon={faMagnifyingGlass} />
      <input type="text" 
        class="input input-sm grow flex-shrink min-w-0 px-8" 
        placeholder={$i18n.t('search')}
        bind:value={searchPattern}
        on:input={updateFilterList}
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
          on:change={updateFilterList} 
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
            onChange={updateFilterList}
            items={[
              { value: true, label: $i18n.t('chatFilter.enabled', {ns: 'optionApp'}) },
              { value: false, label: $i18n.t('chatFilter.disabled', {ns: 'optionApp'}) }
            ]}
          />
        </div>
  
        <div class="relative flex flex-col gap-1">
          <span class="text-sm font-semibold">{$i18n.t('chatFilter.filterType', {ns: 'optionApp'})}</span>
          <RadioFilterButtonGroup
            bind:value={filterByInclude}
            onChange={updateFilterList}
            items={[
              { value: true, label: $i18n.t('chatFilter.include', {ns: 'optionApp'}) },
              { value: false, label: $i18n.t('chatFilter.exclude', {ns: 'optionApp'}) }
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

  <div class="tabs tabs-bordered">
    {#each listTabs as tab}
      <a 
        class="tab tab-sm  min-w-0 " 
        class:tab-active={tab === activeListTab}
        on:click={() => handleClickTab(tab)}
        href={null}
      >
        <span class="whitespace-nowrap overflow-hidden text-ellipsis">{$i18n.t(tab)}</span>
      </a> 
    {/each}
  </div>

  <div class="min-h-[2rem] grow shrink my-1">
    <div class="h-full " bind:this={listContainerEl} >
      <div class={`grid   
        ${
          isEditMode 
          ? 'grid-cols-[min-content_min-content_min-content_minmax(0,_1fr)_min-content]'
          : 'grid-cols-[min-content_min-content_minmax(0,_1fr)_min-content]'
        }
        items-center py-0.5 pl-1 pr-2.5 gap-y-1.5 gap-x-2
      `} >
        {#each chatFilterList as chatFilter, i (chatFilter.id)}
          {#if isEditMode}
            <div class="h-full " class:hidden={!isEditMode}>
              <label class="label h-full cursor-pointer">
              <input type="checkbox" class="checkbox checkbox-sm" 
                value={`${chatFilter.type}|${chatFilter.id}`}
                bind:group={selectedFilterIds}
              />
            </div>
          {/if}

          <div class="flex" class:opacity-50={!chatFilter.isActive}>
            <div class="badge badge-sm badge-outline grow whitespace-nowrap">{$i18n.t(chatFilter.type)}</div>
          </div>

          <div class:opacity-50={!chatFilter.isActive}
            title={chatFilter.isIncluded ? $i18n.t('include') : $i18n.t('exclude')}
          >
            {#if chatFilter.isIncluded}
              <Fa class="text-base text-green-500" icon={faSquarePlus} />
            {:else}
              <Fa class="text-base text-red-500" icon={faSquareMinus} />
            {/if}
          </div>

          <div class:opacity-50={!chatFilter.isActive}>
            {#if chatFilter.type === 'username'}
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="text-sm font-semibold break-words">
                  {chatFilter.username}
                </div>
                <div class="text-sm opacity-60 break-words">
                  {chatFilter.description || ''}
                </div>
              </div>
            {:else if chatFilter.type === 'keyword'}
              <div class="text-sm font-semibold break-words">
                {chatFilter.keyword}
              </div>
            {:else if chatFilter.type === 'badge'}
              <div class="flex flex-col gap-1 min-w-0">
                <div class="flex gap-1.5 items-center">
                  <div class="text-sm font-semibold break-words">
                    {$i18n.t(`chatBadge.${chatFilter.setId}.set`, {
                      ns: 'optionApp',
                      defaultValue: getBadgeTitle($globalChatBadgesStore[chatFilter.setId]) ?? chatFilter.setId
                    })}
                  </div>
                  <img class="w-5 h-5" src={getBadgeFirstVersion($globalChatBadgesStore[chatFilter.setId])?.image_url_2x} alt={null}>
                </div>

                {#if chatFilter.badgeType === 'general'}
                  {#if !chatFilter.versions && !chatFilter.versionRanges}
                    {#if ($globalChatBadgesStore[chatFilter.setId]?.size ?? 0) > 1}
                      <div class="badge badge-success">{$i18n.t('allBadgeVersions')}</div>
                    {/if}
                  {:else}
                    {#if chatFilter.versions?.length}
                      <div class="flex flex-wrap gap-1">
                        {#each chatFilter.versions.slice(0, 10) as versionId (versionId)}
                          <div class="badge badge-ghost gap-1 min-w-0" >
                            <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                              {#if RANGE_SELECTABLE_BADGES.has(chatFilter.setId) && !isNaN(Number(versionId))}
                                {
                                  Number(versionId) > 1 ? 
                                  $i18n.t(`chatBadge.${chatFilter.setId}.version`, {
                                    ns: 'optionApp',
                                    count: Number(versionId),
                                    defaultValue: $globalChatBadgesStore[chatFilter.setId]?.get(versionId)?.title
                                  }) : 
                                  $i18n.t(`chatBadge.${chatFilter.setId}.version_default`, {
                                    ns: 'optionApp',
                                    defaultValue: $globalChatBadgesStore[chatFilter.setId]?.get(versionId)?.title
                                  })
                                }
                              {:else}
                                {$i18n.t(`chatBadge.${chatFilter.setId}.version.${versionId}`, {
                                  ns: 'optionApp',
                                  defaultValue: $globalChatBadgesStore[chatFilter.setId]?.get(versionId)?.title
                                })}
                              {/if}
                            </span>
                            <img class="w-4 h-4" src={$globalChatBadgesStore[chatFilter.setId]?.get(versionId)?.image_url_2x} alt={null}>
                          </div>
                        {/each}
                        {#if chatFilter.versions.length > 10}
                          <div class="text-sm break-words">+{$i18n.t('nVersions', { count: chatFilter.versions.length - 10 })}</div>
                        {/if}
                      </div>
                    {/if}

                    {#if chatFilter.versionRanges?.length}
                      <div class="flex flex-wrap gap-1">
                        {#each chatFilter.versionRanges.slice(0, 10) as range}
                          <div class="badge badge-ghost gap-1 min-w-0" >
                            <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                              {$i18n.t(`chatBadge.${chatFilter.setId}.withUnit`, { 
                                 ns: 'optionApp',
                                 value: `${range[0] ?? ''} ~ ${range[1] ?? ''}`
                              })}
                            </span>
                          </div>
                        {/each}
                        {#if chatFilter.versionRanges.length > 10}
                          <div class="text-sm break-words">+{$i18n.t('nVersionRanges', { count: chatFilter.versionRanges.length - 10 })}</div>
                        {/if}
                      </div>
                    {/if}
                  {/if}
                {:else if chatFilter.badgeType === 'subscriber'}
                  {#if chatFilter.hasSubscriberBadge}
                    {#if !chatFilter.tiers}
                      <div class="badge badge-success max-w-full">
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                          {$i18n.t('allSubscriptionTiers', { ns: 'optionApp' })}
                        </span>
                      </div>
                    {:else if chatFilter.tiers.length}
                      <div class="flex flex-wrap gap-1">
                        {#each chatFilter.tiers as tier (tier)}
                          <div class="badge badge-neutral min-w-0">
                            <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                              {$i18n.t('nTiers', { tier })} 
                            </span>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    {#if !chatFilter.months && !chatFilter.monthRanges}
                      <div class="badge badge-success max-w-full">
                        <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                          {$i18n.t('allSubscriptionMonths', { ns: 'optionApp' })}
                        </span>
                      </div>
                    {:else}
                      {#if chatFilter.months?.length}
                        <div class="flex flex-wrap gap-1 ">
                          {#each chatFilter.months.slice(0, 15) as month (month)}
                            <div class="badge badge-ghost gap-1 min-w-0" >
                              <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                                {$i18n.t('chatBadge.subscriber.withUnit', { 
                                  ns: 'optionApp',
                                  value: month
                               })}
                              </span>
                            </div>
                          {/each}
                          {#if chatFilter.months.length > 15}
                            <div>+{chatFilter.months.length - 15} {$i18n.t('versions')}</div>
                          {/if}
                        </div>
                      {/if}
                      {#if chatFilter.monthRanges?.length}
                        <div class="flex flex-wrap gap-1 ">
                          {#each chatFilter.monthRanges.slice(0, 15) as range}
                            <div class="badge badge-ghost gap-1 min-w-0" >
                              <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                                {$i18n.t(`chatBadge.subscriber.withUnit`, { 
                                  ns: 'optionApp',
                                  value: `${range[0] ?? ''} ~ ${range[1] ?? ''}`
                                })}
                              </span>
                            </div>
                          {/each}
                          {#if chatFilter.monthRanges.length > 15}
                            <div>+{chatFilter.monthRanges.length - 15} {$i18n.t('versionRanges')}</div>
                          {/if}
                        </div>
                      {/if}
                    {/if}
                  {:else}
                    <div class="badge badge-warning max-w-full">
                      <span class="whitespace-nowrap overflow-hidden text-ellipsis">
                        {$i18n.t('withoutSubscriberBadge', { ns: 'optionApp' })}
                      </span>
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>

          <div class="flex items-center">
            <input type="checkbox" class="toggle toggle-sm toggle-primary"
              bind:checked={chatFilter.isActive}
              on:change={() => handleChange([chatFilter.type])}
            />
            <DropdownMenu
              items={[
                {
                  handler: () => modifyChatFilter(chatFilter),
                  text: $i18n.t('edit'),
                  icon: faPen
                },
                {
                  handler: () => openFilterDeleteModal([chatFilter]),
                  text: $i18n.t('delete'),
                  icon: faTrash,
                  type: 'error'
                },
              ]}
            />
          </div>

          {#if i < chatFilterList.length - 1}
            <div class="chat-filter-list-divider col-span-full"></div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
  
  

  <div class="flex justify-between gap-1">
    <div class="flex items-center gap-2">
      <button class="btn btn-sm  "
        on:click={toggleEditMode}
      >
        {$i18n.t(isEditMode ? 'complete' : 'edit')}
      </button>

      {#if isEditMode}
        <div class="flex gap-2 items-center">
          <Tooltip
            placement="top"
            text={$i18n.t(selectedFilterIds.length ? 'deselectAll' : 'selectAll')}
            let:tooltipRef
            let:setShowTooltip
          >
            <input type="checkbox" class="checkbox checkbox-sm"
              checked={Boolean(selectedFilterIds.length)}
              indeterminate={Boolean(selectedFilterIds.length) && selectedFilterIds.length !== chatFilterList.length}
              on:change={toggleAllEditCheckbox}
              use:tooltipRef
              on:mouseenter={() => setShowTooltip(true)}
              on:mouseleave={() => setShowTooltip(false)}
            >
          </Tooltip>
          <span class="text-sm break-words">{$i18n.t('nSelected', { count: selectedFilterIds.length })}</span>
        </div>
      {:else}
        <div class="text-sm break-words">
          {$i18n.t('nItems', { count: chatFilterList.length })}
        </div>
      {/if}

      
    </div>

    <div class="flex flex-wrap gap-1 items-center">
      {#if !isEditMode}
        <button class="btn btn-sm  "
          on:click={addChatFilter}
        >
          <Fa class="text-base" icon={faPlus} />
          {$i18n.t('create')}
        </button>
      {:else}
        <TooltipButton
          placement="top"
          label={$i18n.t(isNoneSelectedActive ? 'enable' : 'disable')}
          class="btn btn-sm btn-square"
          on:click={toggleActiveSelected}
          disabled={!selectedFilterIds.length}
        > 
          <Fa class="text-base" icon={isNoneSelectedActive ? faToggleOn : faToggleOff} />
        </TooltipButton>

        <TooltipButton
          placement="top"
          label={$i18n.t('delete')}
          class="btn btn-sm btn-square btn-error"
          on:click={() => openFilterDeleteModal(selectedFilters)}
          disabled={!selectedFilterIds.length}
        > 
          <Fa class="text-base" icon={faTrashCan} />
        </TooltipButton>
      {/if}
    </div>
  </div>
    
</div>
{:else}
  <div class="flex h-full place-items-center">
    <div class="mx-auto text-lg font-semibold">
      {$i18n.t('noFilterGroup', { ns: 'optionApp' })}
    </div>
  </div>
{/if}

<style>
  .chat-filter-list-divider {
    border-bottom-width: 1px;
    --tw-border-opacity: 1;
    border-bottom-color: var(--fallback-b2, oklch(var(--b2)/var(--tw-border-opacity)));
  }
</style>