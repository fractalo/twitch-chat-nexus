<script lang="ts">
  import { i18n } from "src/i18n";
  import type { BadgeFilter, ChatFilter, ChatFilterType, GeneralBadgeFilter, KeywordFilter, SubscriberBadgeFilter, SubscriberTier, UsernameFilter } from "./types";
  import { SvelteComponent, createEventDispatcher, onMount, type ComponentType } from "svelte";
  import type { DaisyUiModalElement } from "../types";
  import Fa from "svelte-fa";
  import { CHAT_FILTER_TYPES, SUBSCRIBER_BADGE_TYPE } from "./utils";
  import UsernameFilterForm from "./chatFilterForms/UsernameFilterForm.svelte";
  import KeywordFilterForm from "./chatFilterForms/KeywordFilterForm.svelte";
  import BadgeFilterForm from "./chatFilterForms/BadgeFilterForm.svelte";
  import { badgeFilterFormStore, generalBadgeFilterFormStore, isGroupListOpenStore, keywordFilterFormStore, subscriberBadgeFilterFormStore, usernameFilterFormStore } from "./stores";
  import { fromRangeString, type SafeRange } from "src/util/SafeRange";

  interface Events {
    'create': ChatFilter;
    'modify': ChatFilter;
  }

  const dispatch = createEventDispatcher<Events>();

  let initialFilter: ChatFilter | null = null;
  let modalId: string = '';

  let filterType: ChatFilterType = 'username';

  let isIncluded: boolean = true;


  export const openModal = (filter: ChatFilter | ChatFilterType | null) => {
    modalId = crypto.randomUUID(); // reset form
    if (typeof filter !== 'string') {
      initialFilter = filter;
      filterType = filter?.type ?? 'username';
      isIncluded = filter?.isIncluded ?? true;
    } else {
      initialFilter = null;
      filterType = filter;
      isIncluded = true;
    }
    modalEl.showModal();
    $isGroupListOpenStore = false;
  };

  const closeModal = () => {
    modalEl.close();
  };

  const createUsernameFilter = (): UsernameFilter => {
    const {username, description} = $usernameFilterFormStore;
    if (!username) {
      throw new Error('username is required!');
    }

    return {
      id: initialFilter?.id ?? window.crypto.randomUUID(),
      type: 'username',
      isActive: initialFilter?.isActive ?? true,
      isIncluded,
      modifiedAt: Date.now(),
      username,
      description,
    };
  };

  const createKeywordFilter = (): KeywordFilter => {
    const { keyword } = $keywordFilterFormStore;
    if (!keyword) {
      throw new Error('keyword is required!');
    }

    return {
      id: initialFilter?.id ?? window.crypto.randomUUID(),
      type: 'keyword',
      isActive: initialFilter?.isActive ?? true,
      isIncluded,
      modifiedAt: Date.now(),
      keyword,
    };
  };

  const createGeneralBadgeFilter = (setId: string): GeneralBadgeFilter => {
    const formData = $generalBadgeFilterFormStore;

    let versions: string[] | undefined;
    let versionRanges: SafeRange[] | undefined;

    if (!formData.isAllVersions) {
      versions = [...formData.versionIds];
      versionRanges = [...formData.versionRanges].map(fromRangeString);
    }

    return {
      id: initialFilter?.id ?? window.crypto.randomUUID(),
      type: 'badge',
      badgeType: 'general',
      isActive: initialFilter?.isActive ?? true,
      isIncluded,
      modifiedAt: Date.now(),
      setId,
      versions,
      versionRanges,
    };
  };

  const createSubscriberBadgeFilter = (): SubscriberBadgeFilter => {
    const formData = $subscriberBadgeFilterFormStore;
    
    let tiers: SubscriberTier[] | undefined;
    let months: string[] | undefined;
    let monthRanges: SafeRange[] | undefined;
    
    if (!formData.isAllTiers) {
      tiers = formData.tiers;
    }

    if (!formData.isAllMonths) {
      months = [...formData.months];
      monthRanges = [...formData.monthRanges].map(fromRangeString);
    }

    return {
      id: initialFilter?.id ?? window.crypto.randomUUID(),
      type: 'badge',
      badgeType: SUBSCRIBER_BADGE_TYPE,
      setId: SUBSCRIBER_BADGE_TYPE,
      isActive: initialFilter?.isActive ?? true,
      isIncluded,
      modifiedAt: Date.now(),
      hasSubscriberBadge: formData.hasSubscriberBadge,
      tiers,
      months,
      monthRanges,
    }
  };

  const createBadgeFilter = (): BadgeFilter => {
    const { setId } = $badgeFilterFormStore;
    if (!setId) {
      throw new Error('badge set id is required!');
    }

    if (setId === SUBSCRIBER_BADGE_TYPE) {
      return createSubscriberBadgeFilter();
    } else {
      return createGeneralBadgeFilter(setId);
    }
  };

  const filterGenerators = {
    username: createUsernameFilter,
    keyword: createKeywordFilter,
    badge: createBadgeFilter,
  } satisfies Record<ChatFilterType, () => ChatFilter>;

  const submitFilter = () => {
    let chatFilter: ChatFilter;
    try {
      chatFilter = filterGenerators[filterType]();
    } catch (error) {
      return;
    }

    if (initialFilter) {
      dispatch('modify', chatFilter);
    } else {
      dispatch('create', chatFilter);
    }
    closeModal();
  };

  $: isSubmitDisabled = (filterType === 'username' && !$usernameFilterFormStore.username) ||
      (filterType === 'keyword' && !$keywordFilterFormStore.keyword) ||
      (filterType === 'badge' && !$badgeFilterFormStore.setId);

  const formComponents: Record<ChatFilterType, ComponentType<SvelteComponent>> = {
    username: UsernameFilterForm,
    keyword: KeywordFilterForm,
    badge: BadgeFilterForm,
  };


  let modalEl: DaisyUiModalElement;


</script>


<dialog bind:this={modalEl} class="modal" >
  <div class="modal-box flex flex-col overflow-hidden" >
    <h3 class="font-bold text-lg mb-1.5">
      {$i18n.t(initialFilter ? 'editChatFilter' : 'newChatFilter', {ns: 'optionApp'})}
    </h3>

    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={closeModal}
    >✕</button>

    <div class="tabs tabs-boxed my-1">
      {#each CHAT_FILTER_TYPES as type (type)}
        <button class="tab"
          class:tab-active={filterType === type}
          class:tab-disabled={Boolean(initialFilter) && filterType !== type}
          disabled={Boolean(initialFilter) && filterType !== type}
          on:click={() => filterType = type}

        >{$i18n.t(`${type}`)}</button>
      {/each}
    </div>

    <div class="grow shrink min-h-0" data-simplebar>
      <div class="flex flex-col gap-1 p-1" >
        <div class="flex gap-4">
          <div class="form-control">
            <label class="label cursor-pointer justify-normal gap-2">
              <input type="radio" class="radio max-md:radio-sm checked:bg-green-500" value={true} bind:group={isIncluded} />
              <span class="label-text">{$i18n.t('include')}</span> 
            </label>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-normal gap-2">
              <input type="radio" class="radio max-md:radio-sm checked:bg-red-500" value={false} bind:group={isIncluded} />
              <span class="label-text">{$i18n.t('exclude')}</span> 
            </label>
          </div>
        </div>
        
        {#key modalId}
          <svelte:component this={formComponents[filterType]} 
            filter={initialFilter}
          />
        {/key}
      </div>
      
    </div>

    <div class="modal-action z-10">
      <button class="btn btn-sm" on:click={closeModal}>{$i18n.t('cancel')}</button>
      <button class="btn btn-sm btn-primary"
        on:click={submitFilter}
        disabled={isSubmitDisabled}
      >{$i18n.t(initialFilter ? 'save' : 'create')}</button>
    </div>
  </div>
</dialog>
