<script lang="ts" context="module">
  const createTab = (url: string) => chrome.tabs.create({ url });

  export const createDocsTab = (lang: string) => {
    createTab(`https://twitch-chat-nexus.gitbook.io/docs/v/${lang}`)
  };
</script>

<script lang="ts">
  import { i18n } from 'src/i18n';
  import logoSrc from 'src/assets/logo.png';
  import Fa from 'svelte-fa';
  import { faGithub } from '@fortawesome/free-brands-svg-icons';
  import { faBook, faStar } from '@fortawesome/free-solid-svg-icons';
  import TooltipButton from './tooltip/TooltipButton.svelte';
  import BmcLogo from './icons/bmcLogo.svelte';

  const manifest = chrome.runtime.getManifest();


</script>

<div class="h-full flex flex-col">
  <div class="grow shrink min-h-0">
    <div class="h-full" data-simplebar>
      <div class="hero bg-base-100 mt-8">
        <div class="hero-content max-sm:flex-col">
          <img src={logoSrc} alt="logo" class="mx-auto w-12"/>
          <h1 class="text-2xl lg:text-3xl font-bold ">{manifest.name}</h1>
        </div>
      </div>
      
      <div class="hero bg-base-100 mt-4">
        <div class="hero-content">
          <TooltipButton
            class="btn btn-square btn-ghost"
            placement="top"
            label={$i18n.t('help')}
            on:click={() => createDocsTab($i18n.t('helpLanguage', { ns: 'optionApp' }))}
          >
            <Fa class="text-2xl" icon={faBook} />
          </TooltipButton>
    
          <TooltipButton
            class="btn btn-square btn-ghost"
            placement="top"
            label="GitHub"
            on:click={() => createTab("https://github.com/fractalo/twitch-chat-nexus")}
          >
            <Fa class="text-2xl" icon={faGithub} />
          </TooltipButton>
    
          <TooltipButton
            class="btn btn-square btn-ghost"
            placement="top"
            label={$i18n.t('rateExtension', { ns: 'optionApp' })}
            on:click={() => createTab(`https://chromewebstore.google.com/detail/twitch-chat-nexus/oopcjaklhenijofoanbpchndknfadldn/reviews`)}
          >
            <Fa class="text-2xl" icon={faStar} />
          </TooltipButton>

          <TooltipButton
            class="btn btn-square btn-ghost"
            placement="top"
            label="Buy Me a Coffee"
            on:click={() => createTab(`https://www.buymeacoffee.com/fractalo`)}
          >
            <BmcLogo class="w-6 h-6" />
          </TooltipButton>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer footer-center p-2 text-base-content">
    <div class="justify-self-end">
      <div class="badge badge-ghost">{`v${manifest.version}`}</div>
    </div>
  </footer>
</div>


