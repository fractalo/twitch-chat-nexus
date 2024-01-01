<script lang="ts">
  import { i18n } from "src/i18n";
  import type { SubscriberBadgeFilter, SubscriberTier } from "../types";
  import { faXmark } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import { toRangeString } from "src/util/SafeRange";
  import { SUBSCRIBER_TIRES } from "../utils";
  import TooltipButton from "src/components/tooltip/TooltipButton.svelte";
  import { subscriberBadgeFilterFormStore as form } from "../stores";
  
  export let filter: SubscriberBadgeFilter | null;
  
  $form = {
    hasSubscriberBadge: filter?.hasSubscriberBadge ?? true,
    isAllTiers: filter ? !filter.tiers : true,
    isAllMonths: filter ? Boolean(!filter.months && !filter.monthRanges) : true,
    tiers: filter?.tiers ?? [],
    months: new Set(filter?.months),
    monthRanges: new Set(filter?.monthRanges?.map(toRangeString)),
  };

  let monthAddMode: 'single' | 'range' = 'single';

  let month: string = '';

  let minMonth: string = '';
  let maxMonth: string = '';

  const clearMonthInputs = () => {
    month = '';
    minMonth = '';
    maxMonth = '';
  };

  const addMonth = () => {
    month = month.trim();
    if (!month) return;
    const monthNum = Number(month);

    if (isNaN(monthNum) || monthNum < 0) return clearMonthInputs();

    $form.months = $form.months.add(month);
    clearMonthInputs();
  };

  const deleteMonth = (month: string) => {
    $form.months.delete(month);
    $form.months = $form.months;
  };

  const addMonthRange = () => {
    if (!minMonth && !maxMonth) return;

    const minMonthNum = minMonth ? Number(minMonth) : -Infinity;
    const maxMonthNum = maxMonth ? Number(maxMonth) : Infinity;

    if (isNaN(minMonthNum) || isNaN(maxMonthNum)) return clearMonthInputs();

    const monthRange = [minMonthNum, maxMonthNum]
        .sort((a, b) => a - b)
        .map(num => (num === Infinity || num === -Infinity) ? '' : num)
        .join(',');

    $form.monthRanges = $form.monthRanges.add(monthRange);

    clearMonthInputs();
  };

  const deleteMonthRange = (range: string) => {
    $form.monthRanges.delete(range);
    $form.monthRanges = $form.monthRanges;
  }

  const clearMonthSelections = () => {
    $form.months.clear();
    $form.months = $form.months;

    $form.monthRanges.clear();
    $form.monthRanges = $form.monthRanges;
  };


  let isMonthsEditActive: boolean = false;

  $: if (!$form.months.size && !$form.monthRanges.size) {
    isMonthsEditActive = false;
  }
      
</script>


<div class="flex gap-10 items-center">
  <div class="form-control ">
    <label class="label cursor-pointer justify-normal gap-2">
      <input type="radio" class="radio radio-sm" value={true} bind:group={$form.hasSubscriberBadge} />
      <span class="label-text">{$i18n.t('withSubscriberBadge', { ns: 'optionApp' })}</span> 
    </label>
  </div>
  <div class="form-control ">
    <label class="label cursor-pointer justify-normal gap-2">
      <input type="radio" class="radio radio-sm checked:bg-orange-500" value={false} bind:group={$form.hasSubscriberBadge} />
      <span class="label-text">{$i18n.t('withoutSubscriberBadge', { ns: 'optionApp' })}</span> 
    </label>
  </div>
</div>

{#if $form.hasSubscriberBadge}
  <div class="flex gap-10 items-center">
    <div class="form-control">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={true} bind:group={$form.isAllTiers} />
        <span class="label-text">{$i18n.t('allSubscriptionTiers', { ns:'optionApp' })}</span> 
      </label>
    </div>
    <div class="form-control ">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={false} bind:group={$form.isAllTiers} />
        <span class="label-text">{$i18n.t('selectedSubscriptionTiers', { ns:'optionApp' })}</span> 
      </label>
    </div>
  </div>

  {#if !$form.isAllTiers}
    <div class="flex justify-between items-center max-w-xs">
      {#each SUBSCRIBER_TIRES as tier}
        <div class="form-control">
          <label class="label cursor-pointer justify-normal gap-2">
            <input type="checkbox" class="checkbox checkbox-sm" value={tier} bind:group={$form.tiers} />
            <span class="label-text">{$i18n.t(`nTiers`, { tier })}</span> 
          </label>
        </div>
      {/each}
    </div>
  {/if}


  <div class="flex gap-10 items-center">
    <div class="form-control">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={true} bind:group={$form.isAllMonths} />
        <span class="label-text">{$i18n.t('allSubscriptionMonths', { ns:'optionApp' })}</span> 
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={false} bind:group={$form.isAllMonths} />
        <span class="label-text">{$i18n.t('selectedSubscriptionMonths', { ns:'optionApp' })}</span> 
      </label>
    </div>
  </div>

  {#if !$form.isAllMonths}
    <div class="flex justify-between gap-1">
      {#if isMonthsEditActive}
        <button class="btn btn-sm btn-error" on:click={clearMonthSelections}>{$i18n.t('deleteAll')}</button>
      {:else}
        <div class="flex gap-2 min-w-0">
          <select class="select select-sm select-bordered"
              bind:value={monthAddMode}
              on:change={clearMonthInputs}
          >
              <option value="single" >{$i18n.t(`single`)}</option>
              <option value="range" >{$i18n.t(`range`)}</option>
          </select>

          {#if monthAddMode === 'single'}
            <form class="join" on:submit|preventDefault={addMonth}>
              <input type="text" class="input input-sm input-bordered w-32 shrink min-w-0 join-item"
                placeholder={$i18n.t('months')}
                bind:value={month} 
              />
              <button class="btn btn-sm join-item"
                disabled={!month}
              >{$i18n.t('add')}</button>
            </form>
          {:else}
            <form class="join" on:submit|preventDefault={addMonthRange}>
              <input type="text" class="input input-sm input-bordered w-16 shrink min-w-0 join-item"
                placeholder={$i18n.t('min')}
                bind:value={minMonth}
              />
              <input type="text" class="input input-sm input-bordered w-16 shrink min-w-0 join-item"
                placeholder={$i18n.t('max')}
                bind:value={maxMonth}
              />
              <button class="btn btn-sm join-item"
                disabled={!minMonth && !maxMonth}
              >{$i18n.t('add')}</button>
            </form>
          {/if}
        </div>
      {/if}
      
      <button class="btn btn-sm" 
        on:click={() => isMonthsEditActive = !isMonthsEditActive}
        disabled={!$form.months.size && !$form.monthRanges.size}
      >
        {$i18n.t(isMonthsEditActive ? 'complete' : 'edit')}
      </button>
    </div>

    <div class="flex flex-wrap w-full gap-2 mt-2">
      {#each $form.months as month (month)}
        <div class="badge badge-neutral gap-1.5 h-auto">
          <span class="break-all">
            {$i18n.t(`chatBadge.subscriber.version`, { 
              ns: 'optionApp',
              count: Number(month)
            })}
          </span>
          {#if isMonthsEditActive}
            <button title={$i18n.t('delete')} on:click={() => deleteMonth(month)}><Fa icon={faXmark} /></button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex flex-wrap w-full gap-2 mt-2">
      {#each $form.monthRanges as range (range)}
        <div class="badge badge-neutral gap-1.5 h-auto">
          <span class="break-all">
            {$i18n.t(`chatBadge.subscriber.withUnit`, { 
              ns: 'optionApp',
              value: range.split(',').join(' ~ ')
            })}
          </span>
          {#if isMonthsEditActive}
            <button title={$i18n.t('delete')} on:click={() => deleteMonthRange(range)}><Fa icon={faXmark} /></button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}
  
  
  
  
  
  
  