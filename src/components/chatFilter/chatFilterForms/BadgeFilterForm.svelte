<script lang="ts">
  import { i18n } from "src/i18n";
  import { globalChatBadgesStore, badgeFilterFormStore as form, getBadgeFirstVersion, getBadgeTitle } from "../stores";
  import type { BadgeFilter } from "../types";
  import GeneralBadgeVersionForm from "./GeneralBadgeVersionForm.svelte";
  import SubscriberBadgeVersionForm from "./SubscriberBadgeVersionForm.svelte";
  import { SUBSCRIBER_BADGE_TYPE } from "../utils";
  import { BADGE_GROUPS, GROUPPED_BADGES } from "../chatBadges";
  
  
  export let filter: BadgeFilter | null;

  $form.setId = '';

  if (filter) {
    if (filter.badgeType === 'general') {
      $form.setId = filter.setId;
    } else if (filter.badgeType === SUBSCRIBER_BADGE_TYPE) {
      $form.setId = filter.badgeType;
    }
  }
  
</script>


<div class="form-control w-full ">
  <label for="select-badge-set" class="label">
    <span class="label-text">{$i18n.t('chatFilter.badgeSet', { ns: 'optionApp' })}</span>
  </label>
  <div class="flex gap-2">
    {#if Object.keys($globalChatBadgesStore).length}
      <select class="select select-sm select-bordered grow shrink min-w-0"
        id="select-badge-set"
        bind:value={$form.setId}
      >
        <option value="" selected disabled>{$i18n.t(`selectBadge`)}</option>
        {#each Object.entries(BADGE_GROUPS) as [badgeGroupId, setIds] (badgeGroupId)}
          <optGroup label={$i18n.t(`chatBadgeGroup.${badgeGroupId}`, { ns: 'optionApp' })}>
            {#each setIds as setId}
              {#if Object.hasOwn($globalChatBadgesStore, setId)}
                <option value={setId} >
                  {$i18n.t(`chatBadge.${setId}.set`, {
                    ns: 'optionApp',
                    defaultValue: getBadgeTitle($globalChatBadgesStore[setId]) ?? setId
                  })}
                </option>
              {/if}
            {/each}
          </optGroup>
        {/each}
        <optgroup label={$i18n.t(`chatBadgeGroup.others`, { ns: 'optionApp' })}>
          {#each Object.entries($globalChatBadgesStore) as [setId, versions] (setId) }
            {#if !GROUPPED_BADGES.has(setId)}
              <option value={setId} >
                {$i18n.t(`chatBadge.${setId}.set`, {
                  ns: 'optionApp',
                  defaultValue: getBadgeTitle($globalChatBadgesStore[setId]) ?? setId
                })}
              </option>
            {/if}
          {/each}
        </optgroup>
      </select>
    {:else}
      <div class="animate-pulse h-8 w-4/5 rounded-lg bg-base-300"></div>
    {/if}
    
    {#if $form.setId}
      <img class="w-8 h-8" src={getBadgeFirstVersion($globalChatBadgesStore[$form.setId])?.image_url_4x} alt={null} />
    {/if}
  </div>
</div>


{#if $form.setId === SUBSCRIBER_BADGE_TYPE}
  <SubscriberBadgeVersionForm 
    filter={filter?.badgeType === SUBSCRIBER_BADGE_TYPE ? filter : null}
  />
{:else}
  {#key $form.setId}
    <GeneralBadgeVersionForm 
      filter={filter?.badgeType === 'general' && filter.setId === $form.setId ? filter : null}
      setId={$form.setId}
    />
  {/key}
{/if}
