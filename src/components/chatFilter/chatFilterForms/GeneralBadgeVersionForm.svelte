<script lang="ts">
  import { i18n } from "src/i18n";
  import { globalChatBadgesStore, generalBadgeFilterFormStore as form } from "../stores";
  import type { ChatBadgeVersionById, GeneralBadgeFilter } from "../types";
  import { faXmark } from "@fortawesome/free-solid-svg-icons";
  import Fa from "svelte-fa";
  import { toRangeString } from "src/util/SafeRange";
  import { RANGE_SELECTABLE_BADGES } from "../chatBadges";

  export let filter: GeneralBadgeFilter | null;

  export let setId: string;

  const versionDataById: ChatBadgeVersionById = $globalChatBadgesStore[setId] ?? new Map();

  const versions = [...versionDataById.values()];

  const areNumericVerionIds = versions.every(version => !isNaN(Number(version.id)));

  if (areNumericVerionIds) {
    versions.sort((a, b) => Number(a.id) - Number(b.id));
  }

  $form = {
    isAllVersions: filter ? Boolean(!filter.versions && !filter.versionRanges) : true,
    versionIds: new Set(filter?.versions),
    versionRanges: new Set(filter?.versionRanges?.map(toRangeString)),
  };

  let versionAddMode: 'single' | 'range' = 'single';

  let versionId: string = '';

  let minVersionId: string = '';
  let maxVersionId: string = '';

  const clearVersionInputs = () => {
    versionId = '';
    minVersionId = '';
    maxVersionId = '';
  };

  const addVersionId = () => {
    if (!versionId) return;
    $form.versionIds = $form.versionIds.add(versionId);
    clearVersionInputs();
  };

  const deleteVersionId = (id: string) => {
    $form.versionIds.delete(id);
    $form.versionIds = $form.versionIds;
  };

  const addVersionRange = () => {
    if (!minVersionId && !maxVersionId) return;

    const minVersionNum = minVersionId ? Number(minVersionId) : -Infinity;
    const maxVersionNum = maxVersionId ? Number(maxVersionId) : Infinity;

    if (isNaN(minVersionNum) || isNaN(maxVersionNum)) return clearVersionInputs();

    const versionRange = [minVersionNum, maxVersionNum]
        .sort((a, b) => a - b)
        .map(num => (num === Infinity || num === -Infinity) ? '' : num)
        .join(',');

    $form.versionRanges = $form.versionRanges.add(versionRange);

    clearVersionInputs();
  };

  const deleteVersionRange = (range: string) => {
    $form.versionRanges.delete(range);
    $form.versionRanges = $form.versionRanges;
  }

  const clearVersionSelections = () => {
    $form.versionIds.clear();
    $form.versionIds = $form.versionIds;

    $form.versionRanges.clear();
    $form.versionRanges = $form.versionRanges;
  };


  let isVersionsEditActive: boolean = false;

  $: if (!$form.versionIds.size && !$form.versionRanges.size) {
    isVersionsEditActive = false;
  }
    
</script>

{#if versions.length > 1}
  <div class="flex gap-10">
    <div class="form-control">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={true} bind:group={$form.isAllVersions} />
        <span class="label-text">{$i18n.t('allVersions')}</span> 
      </label>
    </div>
    <div class="form-control">
      <label class="label cursor-pointer justify-normal gap-2">
        <input type="radio" class="radio radio-sm" value={false} bind:group={$form.isAllVersions} />
        <span class="label-text">{$i18n.t('selectedVersions')}</span> 
      </label>
    </div>
  </div>

  {#if $form.isAllVersions}
    <div class="flex flex-wrap gap-2">
      {#each versions as version (version.id)}
        <img class="w-6 h-6" src={version.image_url_2x} alt={null} title={version.title} />
      {/each}
    </div>
  {:else}
    <div class="flex justify-between gap-1">
      {#if isVersionsEditActive}
        <button class="btn btn-sm btn-error" on:click={clearVersionSelections}>{$i18n.t('deleteAll')}</button>
      {:else}
        <div class="flex gap-2 min-w-0">
          {#if RANGE_SELECTABLE_BADGES.has(setId)}
            <select class="select select-sm select-bordered"
              bind:value={versionAddMode}
              on:change={clearVersionInputs}
            >
              <option value="single">{$i18n.t(`single`)}</option>
              <option value="range">{$i18n.t(`range`)}</option>
            </select>
          {/if}

          {#if versionAddMode === 'single'}
            <form class="join min-w-0 shrink " on:submit|preventDefault={addVersionId}>
              <select class="select select-sm select-bordered min-w-0 shrink join-item"
                bind:value={versionId}
              >
                <option value="" selected disabled>{$i18n.t(`selectVersion`)}</option>
                {#each versions as version (version.id) }
                  <option value={version.id}>
                    {#if RANGE_SELECTABLE_BADGES.has(setId) && !isNaN(Number(version.id))}
                      {
                        Number(version.id) > 1 ? 
                        $i18n.t(`chatBadge.${setId}.version`, {
                          ns: 'optionApp',
                          count: Number(version.id),
                          defaultValue: versionDataById.get(version.id)?.title
                        }) : 
                        $i18n.t(`chatBadge.${setId}.version_default`, {
                          ns: 'optionApp',
                          defaultValue: versionDataById.get(version.id)?.title
                        })
                      }
                    {:else}
                      {$i18n.t(`chatBadge.${setId}.version.${version.id}`, {
                        ns: 'optionApp',
                        defaultValue: versionDataById.get(version.id)?.title
                      })}
                    {/if}
                  </option>
                {/each}
              </select>
              <button class="btn btn-sm join-item"
                disabled={!versionId}
              >{$i18n.t('add')}</button>
            </form>
          {:else}
            <form class="join min-w-0 shrink" on:submit|preventDefault={addVersionRange}>
              <input type="text" class="input input-sm input-bordered w-20 min-w-0 shrink join-item"
                placeholder={$i18n.t('min')}
                bind:value={minVersionId}
              />
              <input type="text" class="input input-sm input-bordered w-20 min-w-0 shrink join-item"
                placeholder={$i18n.t('max')}
                bind:value={maxVersionId}
              />
              <button class="btn btn-sm join-item"
                disabled={!minVersionId && !maxVersionId}
              >{$i18n.t('add')}</button>
            </form>
          {/if}
        </div>
      {/if}
      
      <button class="btn btn-sm" 
        on:click={() => isVersionsEditActive = !isVersionsEditActive}
        disabled={!$form.versionIds.size && !$form.versionRanges.size}
      >{$i18n.t(isVersionsEditActive ? 'complete' : 'edit')}</button>
    </div>

    <div class="flex flex-wrap w-full gap-2 mt-2">
      {#each $form.versionIds as id (id)}
        <div class="badge badge-neutral gap-1.5 h-auto">
          <span class="break-all">
            {#if RANGE_SELECTABLE_BADGES.has(setId) && !isNaN(Number(id))}
              {
                Number(id) > 1 ? 
                $i18n.t(`chatBadge.${setId}.version`, {
                  ns: 'optionApp',
                  count: Number(id),
                  defaultValue: versionDataById.get(id)?.title
                }) : 
                $i18n.t(`chatBadge.${setId}.version_default`, {
                  ns: 'optionApp',
                  defaultValue: versionDataById.get(id)?.title
                })
              }
            {:else}
              {$i18n.t(`chatBadge.${setId}.version.${id}`, {
                ns: 'optionApp',
                defaultValue: versionDataById.get(id)?.title
              })}
            {/if}
          </span>
          <img class="w-5 h-5" src={versionDataById.get(id)?.image_url_2x} alt={null} />
          {#if isVersionsEditActive}
            <button title={$i18n.t('delete')} on:click={() => deleteVersionId(id)}><Fa icon={faXmark} /></button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="flex flex-wrap w-full gap-2 mt-2">
      {#each $form.versionRanges as range (range)}
        <div class="badge badge-neutral gap-1.5 h-auto">
          <span class="break-all">
            {$i18n.t(`chatBadge.${setId}.withUnit`, { 
              ns: 'optionApp',
              value: range.split(',').join(' ~ ')
            })}
          </span>
          {#if isVersionsEditActive}
            <button title={$i18n.t('delete')} on:click={() => deleteVersionRange(range)}><Fa icon={faXmark} /></button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}





