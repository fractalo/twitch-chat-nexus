<script lang="ts">
  import ToggleSetting from "./ToggleSetting.svelte";
  import SelectSetting from "./SelectSetting.svelte";
  import {
    settingDefinitions,
    getSettingsI18nMessage,
    getSettingValues,
    type MainCategorySettingValues,
  } from "./settings";

  let settingValues: MainCategorySettingValues | null = null;

  getSettingValues().then((values) => (settingValues = values));

  let currentMenu = Object.keys(settingDefinitions)[0];

  const handleChange = () => {
    chrome.storage.sync.set({ settings: settingValues });
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
        {getSettingsI18nMessage([menu])}
      </a>
    {/each}
  </div>

  {#if settingValues}
    <div class="grow h-0" data-simplebar data-simplebar-auto-hide="false">
      <div class="flex flex-col gap-4 px-4 py-3">
        {#each Object.keys(settingDefinitions[currentMenu] || {}) as category (category)}
          <div class="flex flex-col w-full gap-1">
            <h2 class="text-base ">
              {getSettingsI18nMessage([currentMenu, category])}
            </h2>
            <div class="card bg-base-200 rounded-box place-items-center p-3 gap-1">
              {#each Object.entries(settingDefinitions[currentMenu][category]) as [id, setting] (id)}
                <div class="form-control w-full max-w-xs">
                  {#if typeof setting.default === "string"}
                    <SelectSetting
                      bind:value={settingValues[currentMenu][category][id]}
                      on:change={handleChange}
                      settingName={getSettingsI18nMessage([
                        currentMenu,
                        category,
                        id,
                      ])}
                      {id}
                      options={setting.options.map((option) => {
                        return {
                          id: option,
                          name: getSettingsI18nMessage([
                            currentMenu,
                            category,
                            id,
                            option,
                          ]),
                        };
                      })}
                    />
                  {:else}
                    <ToggleSetting
                      bind:value={settingValues[currentMenu][category][id]}
                      on:change={handleChange}
                      settingName={getSettingsI18nMessage([
                        currentMenu,
                        category,
                        id,
                      ])}
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