<script lang="ts">
  import { i18n } from "src/i18n";
  import type { UsernameFilter } from "../types";
  import {usernameFilterFormStore as form } from "../stores";

  export let filter: UsernameFilter | null;

  $form.username = filter?.username ?? '';

  $form.description = filter?.description ?? '';

  const handleUsernameInput = () => {
    $form.username = $form.username.trim();
    $form.username = $form.username.replace(/\s/g,'');
  };

</script>

<div class="form-control w-full">
  <label for="username-input" class="label">
    <span class="label-text">{$i18n.t('username', { ns: 'optionApp' })} / {$i18n.t('displayName', { ns: 'optionApp' })}</span>
  </label>
  <input id="username-input" type="text" class="input input-sm input-bordered" 
    bind:value={$form.username} 
    on:input={handleUsernameInput}
  />
</div>

<div class="form-control w-full">
  <label for="description-input" class="label">
    <span class="label-text">{$i18n.t('description')}</span>
  </label>
  <input id="description-input" type="text" class="input input-sm input-bordered" 
    bind:value={$form.description} 
  />
</div>