<script lang="ts">
  import { i18n } from "src/i18n";
  import Button from "../../components/Button.svelte";
  import { createEventDispatcher } from "svelte";
  import XMark from "../../components/icons/XMark.svelte";
  import messaging from "../../messaging";
  import IconButton from "../../components/IconButton.svelte";
  import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

  let logoImgUrl: string = '';

  messaging.postMessage({
    type: 'GET_RUNTIME_URL',
    content: 'src/assets/logo.png'
  }, (message) => {
    logoImgUrl = message.content;
  });

  let appVersion: string = '';

  messaging.postMessage({
    type: 'GET_APP_VERSION'
  }, (message) => {
    appVersion = message.content;
  });

  const dispatch = createEventDispatcher();

  const closeCard = () => {
    dispatch('close');
  };


  const contents = $i18n.t('appNotice.contents', { ns: 'mainApp', returnObjects: true });

</script>

<div class="absolute top-[6rem] right-[1rem] z-[1000]">
  <div class="tcn-card  w-[32rem] rounded-[0.4rem]">
    <div class="w-full max-h-[50rem] flex flex-col">
      <div class="daisy-navbar" >
        <div class="daisy-navbar-start grow">
          <div class="tcn-card-title flex items-center gap-[0.8rem] ml-[0.7rem]">
            {#if logoImgUrl}
              <img class="w-8" src={logoImgUrl} alt={null}>
            {/if}
            <span>Twitch Chat Nexus</span>
            <span class="text-[1.1rem] font-normal">v{appVersion}</span>
          </div>
        </div>
        <div class="daisy-navbar-end w-auto">
          <Button type="ghost" isSquare={true} on:click={closeCard} >
            <XMark class="w-8 h-8 fill-current" />
          </Button>
        </div>
      </div>
      <div class="grow min-h-0 w-full p-4 flex flex-col">
        <div class="font-semibold mb-6 text-[var(--color-text-brand)]">
          {$i18n.t('appNotice.highlight', { ns: 'mainApp' })}
        </div>
        <div class="font-semibold text-[1.4rem] mb-4">
          {$i18n.t('appNotice.newFeature', { ns: 'mainApp' })} - {$i18n.t('filteredChatView._self', { ns: 'settings' })}
        </div>
        <div class="flex flex-col gap-4">
          {#if Array.isArray(contents)}
            {#each contents as content}
              <div class="flex gap-2">
                <div>•</div>
                <div>{content}</div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
      <div class="tcn-card-button-group flex justify-end items-center px-2 py-4">
        <div class="flex gap-2 pr-2">
          <Button type="normal" on:click={closeCard}>
            <span>{$i18n.t('confirm')}</span>
          </Button> 
          <IconButton icon={faArrowUpRightFromSquare} text={$i18n.t('appNotice.openOptionsPage', { ns: 'mainApp' })} type="primary" textPosition="right"
            on:click={() => messaging.postMessage({type: 'OPEN_OPTIONS_PAGE'})}
          />
        </div>
      </div>
    </div>
  </div>
</div>

