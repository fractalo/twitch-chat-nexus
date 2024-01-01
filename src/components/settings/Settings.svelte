<script lang="ts">
  import ToggleSetting from "./ToggleSetting.svelte";
  import SelectSetting from "./SelectSetting.svelte";
  import RangeSetting from "./RangeSetting.svelte";
  import {
    settingDefinitions,
    type SettingDefinitionId,
  } from "./definitions";
  import type { Setting, SettingGroups, SettingValueEvent, SettingValueGroups } from "./types";
  
  import { i18n } from "src/i18n";
  import type { ResourceKey } from "i18next";
  import { getSettingValues, setSettingValues } from "./utils";
  import { onDestroy, type ComponentType, type SvelteComponent } from "svelte";

  
  export let definitionId: SettingDefinitionId;

  let settingValues: SettingValueGroups | null = null;

  let settingGroups: SettingGroups;

  getSettingValues(definitionId).then((values) => {
    settingValues = values;
  });

  settingGroups = settingDefinitions[definitionId];

  const getSettingsI18n = (keys: string[] = []): string => {
    const key = [definitionId, ...keys].join('.');
    const value = $i18n.t(key, { 
      ns: 'settings',
      returnObjects: true,
    }) as ResourceKey;
    return typeof value === 'string' ? value : value._self;  
  };

  let settingTitle: string = getSettingsI18n();

  $: settingTitle = ($i18n, getSettingsI18n());
  
  const handleStorageChange: Parameters<typeof chrome.storage.local.onChanged.addListener>[0] = (changes) => {
    const key = Object.keys(changes).find(key => key === `settings.${definitionId}`);
    if (!key || !changes[key].newValue) return;
    settingValues = changes[key].newValue;
  };

  chrome.storage.local.onChanged.addListener(handleStorageChange);

  const handleChange = (event: CustomEvent<SettingValueEvent>) => {
    if (!settingValues) return;
    const {category, name, settingValue} = event.detail;
    settingValues[category][name] = settingValue;
    setSettingValues(definitionId, settingValues);
  };

  const settingComponents: Record<Setting['type'], ComponentType<SvelteComponent>> = {
    select: SelectSetting,
    toggle: ToggleSetting,
    range: RangeSetting,
  };

  onDestroy(() => {
    chrome.storage.local.onChanged.removeListener(handleStorageChange);
  });

</script>

{#key $i18n}
  <div class="max-w-screen-md mx-auto h-full">
      <div class="flex flex-col gap-4 p-3.5 lg:p-8">
        <h1 class="text-lg lg:text-xl font-bold">
          {settingTitle}
        </h1>

        {#if settingValues}
          {#each Object.entries(settingGroups) as [category, settingGroup] (category)}
            <div class="flex flex-col w-full gap-1">
              <h2 class="text-base">
                {getSettingsI18n([category])}
              </h2>
              <div class="card bg-base-200 rounded-box py-2 px-3 gap-2">
                {#each Object.entries(settingGroup) as [name, setting] (name)}
                  <div class="form-control w-full">
                    <svelte:component this={settingComponents[setting.type]} 
                      settingValue={settingValues[category][name]}
                      {category}
                      {name}
                      {setting}
                      {getSettingsI18n}
                      on:change={handleChange}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        {/if}
      </div>
  </div>
{/key}



