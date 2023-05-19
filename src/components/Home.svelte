<script lang="ts">
  import logoSrc from 'src/assets/logo.png';
  import Fa from 'svelte-fa/src/fa.svelte';
  import { faGithub } from '@fortawesome/free-brands-svg-icons';
  import { faCircleQuestion, faStar } from '@fortawesome/free-solid-svg-icons';
  import { i18n } from 'src/i18n';

  const manifest = chrome.runtime.getManifest();

  const createTab = (url: string) => chrome.tabs.create({ url });

</script>

<div class="flex flex-col h-full">
  <div class="hero bg-base-100">
    <div class="hero-content flex-col text-center">
      <img src={logoSrc} alt="logo" class="mx-auto w-12"/>
      <h1 class="text-2xl font-bold ">{manifest.name}</h1>
    </div>
  </div>
  
  <div class="hero bg-base-100 mt-4">
    <div class="hero-content">
      <div class="tooltip tooltip-bottom" data-tip="{$i18n.t('help')}">
        <button class="btn btn-primary btn-square btn-ghost normal-case"
          on:click={() => createTab(`https://twitch-chat-history.gitbook.io/docs/v/${$i18n.t('helpLanguage')}`)}
        >
          <Fa class="text-2xl" icon={faCircleQuestion} />
        </button>
      </div>

      <div class="tooltip tooltip-bottom" data-tip="GitHub">
        <button class="btn btn-primary btn-square btn-ghost normal-case"
          on:click={() => createTab("https://github.com/fractalo/twitch-chat-history")}
        >
          <Fa class="text-2xl" icon={faGithub} />
        </button>
      </div>

      <div class="tooltip tooltip-bottom" data-tip="{$i18n.t('rate')}">
        <button class="btn btn-primary btn-square btn-ghost normal-case"
          on:click={() => createTab(`https://chrome.google.com/webstore/detail/twitch-chat-history/oopcjaklhenijofoanbpchndknfadldn/reviews`)}
        >
          <Fa class="text-2xl" icon={faStar} />
        </button>
      </div>
    </div>
  </div>


  <footer class="footer footer-center p-4  text-base-content mt-auto">
    <div class="justify-self-end">
      <p>{`v${manifest.version}`}</p>
    </div>
  </footer>
</div>
