<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { SettingValueEvent, ToggleSetting } from "./types";

  export let settingValue: ToggleSetting["default"];

  export let category: string;
  export let name: string;

  export let getSettingsI18n: (keys: string[]) => string;

  const dispatch = createEventDispatcher<{ change: SettingValueEvent }>();
</script>

<label class="label cursor-pointer">
  <span class="label-text">
    {getSettingsI18n([category, name])}
  </span>
  <input
    type="checkbox"
    class="toggle toggle-sm toggle-primary"
    bind:checked={settingValue}
    on:change={() => dispatch("change", { category, name, settingValue })}
  />
</label>
