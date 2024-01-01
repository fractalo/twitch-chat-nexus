<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SelectSetting, SettingValueEvent } from "./types";

  export let settingValue: SelectSetting["default"];

  export let category: string;
  export let name: string;
  export let setting: SelectSetting;

  export let getSettingsI18n: (keys: string[]) => string;

  const suffix = setting.suffix || '';
  const id = [category, name].join('-');

  const getOptionString = (option: string | number) => {
    return (typeof option === 'string' ? getSettingsI18n([category, name, option]) : option.toString()) + suffix;
  };

  const dispatch = createEventDispatcher<{ change: SettingValueEvent }>();

</script>

<label for={id} class="label" >
  <span class="label-text">
    {getSettingsI18n([category, name])}
  </span>
</label>

{#if setting?.isRadio}
  <div class="flex gap-x-4 lg:gap-x-6 flex-wrap">
    {#each setting.options as option}
      <div class="form-control">
        <label class="label cursor-pointer justify-normal gap-2">
          <input type="radio" class="radio radio-sm checked:radio-primary" 
            value={option} 
            bind:group={settingValue} 
            on:change={() => dispatch('change', { category, name, settingValue })}
          />
          <span class="text-sm">{getOptionString(option)}</span> 
        </label>
      </div>
    {/each}
  </div>
{:else}
  <select
    {id}
    class="select select-sm"
    bind:value={settingValue}
    on:change={() => dispatch('change', { category, name, settingValue })}
  >
    {#each setting.options as option}
      <option value={option}>
        {getOptionString(option)}
      </option>
    {/each}
  </select>
{/if}
