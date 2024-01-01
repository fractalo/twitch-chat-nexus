<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { RangeSetting, SettingValueEvent } from "./types";

  export let settingValue: RangeSetting["default"];

  export let category: string;
  export let name: string;
  export let setting: RangeSetting;

  export let getSettingsI18n: (keys: string[]) => string;

  const id = [category, name].join("-");

  const dispatch = createEventDispatcher<{ change: SettingValueEvent }>();
</script>

<label for={id} class="label">
  <span class="label-text">
    {getSettingsI18n([category, name])}
  </span>
</label>
<div class="flex gap-2">
  <input
    {id}
    type="range"
    class="range range-sm range-primary"
    bind:value={settingValue}
    on:change={() => dispatch("change", { category, name, settingValue })}
    min={setting.min}
    max={setting.max}
    step={setting.step}
  />
  <span class="text-sm font-semibold whitespace-nowrap">
    {settingValue}{setting.unit || getSettingsI18n([category, name, 'unit'])}
  </span>
</div>
