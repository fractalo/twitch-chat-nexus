<script lang="ts">
  import { i18n } from "src/i18n";
    
</script>

<div class="flex flex-col mt-4 gap-4">
  <select class="select select-sm select-bordered w-28 join-item">
    <option selected>{$i18n.t('username')}</option>
    <option>{$i18n.t('keyword')}</option>
    <option>{$i18n.t('badge')}</option>
  </select>

  <div class="join w-full">
    <input class="input input-sm input-bordered flex-auto join-item min-w-0" placeholder=""/>
    <select class="select select-sm select-bordered join-item">
      <option selected>{$i18n.t('include')}</option>
      <option>{$i18n.t('exclude')}</option>
    </select>
    <button class="btn btn-sm btn-primary join-item">{$i18n.t('add')}</button>
  </div>
</div>