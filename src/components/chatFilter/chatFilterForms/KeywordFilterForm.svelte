<script lang="ts">
  import { i18n } from "src/i18n";
  import type { KeywordFilter } from "../types";
  import { keywordFilterFormStore as form } from "../stores";
  
  
  export let filter: KeywordFilter | null;

  $form.keyword = filter?.keyword ?? '';
  
</script>

<div class="form-control w-full">
  <label for="keyword-input" class="label">
    <span class="label-text">{$i18n.t('keyword')}</span>
  </label>
  <input id="keyword-input" type="text" class="input input-sm input-bordered" 
    bind:value={$form.keyword} 
  />
</div>