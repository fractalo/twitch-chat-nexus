<script lang="ts">
  import ToggleSetting from "./ToggleSetting.svelte";
  import SelectSetting from "./SelectSetting.svelte";
  import {
    settingDefinitions,
    getSettingValues
  } from "./settings";
  import type { MainCategorySettingValues } from "./types";
  import RangeSetting from "./RangeSetting.svelte";
  import { i18n } from "src/i18n";
  import type { ResourceKey } from "i18next";

  let settingValues: MainCategorySettingValues | null = null;

  getSettingValues().then((values) => (settingValues = values));

  let currentMenu = Object.keys(settingDefinitions)[0];

  const handleChange = () => {
    chrome.storage.local.set({ settings: settingValues });
  };

  const getSettingsI18n = (keys: string[]) => {
    const key = keys.join('.');
    const value: ResourceKey = $i18n.t(key, { 
      ns: 'settings',
      returnObjects: true,
      defaultValue: ''
    });
    return typeof value === 'string' ? value : value._self; 
  };

</script>

<div class="flex flex-col h-full" >
  <div class="tabs tabs-boxed bg-base-300 rounded-none">
    {#each Object.keys(settingDefinitions) as menu}
      <a
        href={null}
        class="tab text-sm {currentMenu === menu ? 'tab-active' : ''} rounded-none"
        on:click={() => (currentMenu = menu)}
      >
        {getSettingsI18n([menu])}
      </a>
    {/each}
  </div>

  {#if settingValues}
    <div class="grow h-0" data-simplebar data-simplebar-auto-hide="false">
      <div class="flex flex-col gap-4 px-4 py-3">
        {#each Object.keys(settingDefinitions[currentMenu] || {}) as category (category)}
          <div class="flex flex-col w-full gap-1">
            <h2 class="text-base ">
              {getSettingsI18n([currentMenu, category])}
            </h2>
            <div class="card bg-base-200 rounded-box place-items-center p-3 gap-1">
              {#each Object.entries(settingDefinitions[currentMenu][category]) as [setting, definition] (setting)}
                <div class="form-control w-full max-w-xs">
                  {#if definition.type === "select"}
                    <SelectSetting
                      bind:value={settingValues[currentMenu][category][setting]}
                      on:change={handleChange}
                      settingName={getSettingsI18n([currentMenu, category, setting])}
                      id={[currentMenu, category, setting].join('.')}
                      options={definition.options.map((option) => {
                        return {
                          id: option,
                          name: getSettingsI18n([currentMenu, category, setting, option]),
                        };
                      })}
                    />
                  {:else if definition.type === 'toggle'}
                    <ToggleSetting
                      bind:value={settingValues[currentMenu][category][setting]}
                      on:change={handleChange}
                      settingName={getSettingsI18n([currentMenu, category, setting])}
                    />
                  {:else if definition.type === 'range'}
                    <RangeSetting
                      bind:value={settingValues[currentMenu][category][setting]}
                      on:change={handleChange}
                      settingName={getSettingsI18n([currentMenu, category, setting])}
                      id={[currentMenu, category, setting].join('.')}
                      min={definition.min}
                      max={definition.max}
                      step={definition.step}
                      unit={definition.unit}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>

</style>