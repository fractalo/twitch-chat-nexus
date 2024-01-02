<script lang="ts">
  import { i18n } from "src/i18n";

  export let newChatCount: number = 0;

  const MAX_NEW_CHAT_COUNT = 30;


</script>

<div class="tcn-chat-footer">
  {#if newChatCount > 0}
    <div class="tcn-chat-footer-badge absolute font-semibold top-[-0.95rem] right-[-0.5rem] z-[1]">
      {#if newChatCount <= MAX_NEW_CHAT_COUNT}
        {newChatCount}
      {:else}
        {MAX_NEW_CHAT_COUNT}+
      {/if}
    </div>
  {/if}

  <button class="tcn-chat-footer-button w-12 h-12" on:click>
    <div class="tcn-chat-footer-icon-wrapper">
      <div class="tcn-chat-footer-icon">
        <svg
          width="100%"
          height="100%"
          version="1.1"
          viewBox="0 0 20 20"
          x="0px"
          y="0px"
          class="fill-current"
        >
          <g><path d="M11 11l1.5-1.5L14 11l-4 4-4-4 1.5-1.5L9 11V5h2v6z"/></g>
        </svg>
      </div>
    </div>
  </button>
</div>

<style>
  .tcn-chat-footer {
    border: 1px solid var(--color-border-overlay);
    border-radius: 50%;
    right: 1rem;
    bottom: 0px !important;
    background-color: var(--color-background-overlay-alt) !important;
    color: var(--color-text-overlay) !important;
    margin-bottom: 0.25rem !important;
    position: absolute !important;
  }

  .tcn-chat-footer-badge {
    color: var(--color-text-pill);
    background-color: var(--color-background-brand);
    font-size: 1.2rem;
    padding: 0 0.6rem;
    line-height: 1.6;
    text-align: center;
    user-select: none;
    border-radius: var(--border-radius-rounded);
  }

  .tcn-chat-footer-button {
    background-color: var(--color-background-button-overlay-text-default);
    color: var(--color-text-button-overlay-text);
    display: inline-flex;
    position: relative;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    vertical-align: middle;
    overflow: hidden;
    text-decoration: none;
    white-space: nowrap;
    user-select: none;
    font-weight: var(--font-weight-semibold);
    border-radius: 50%;
    font-size: var(--button-text-default);
    height: var(--button-size-default);
    background: none;
    border: none;
    font: inherit;
    text-align: inherit;
  }

  .tcn-chat-footer-button:hover {
    background-color: var(--color-background-button-overlay-text-hover);
    color: var(--color-text-button-overlay-text);
    cursor: pointer;
  }

  .tcn-chat-footer-button:active {
    background-color: var(--color-background-button-overlay-text-active);
    color: var(--color-text-button-overlay-text);
  }

  .tcn-chat-footer-icon-wrapper {
    display: inline-flex;
    -webkit-box-align: center;
    align-items: center;
    height: 2rem;
    width: 2rem;
  }

  .tcn-chat-footer-icon {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
