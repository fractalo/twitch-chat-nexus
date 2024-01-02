<script lang="ts">
    import Fa from 'svelte-fa';
    import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
    import { i18n } from 'src/i18n';

    export let handleButtonClick: () => void;

</script>


<button class="tw-chat-settings-button tw-interactive"
    on:click={handleButtonClick}
>
    <div class="tw-chat-settings-button-content-container">
        <div class="tw-chat-settings-button-text">{$i18n.t('chatLogViewOpeningButton.label', { ns: 'mainApp' })}</div>
        <div class="tw-chat-settings-button-icon-wrapper">
            <div class="tw-chat-settings-button-icon">
                <Fa class="text-[1.65rem]" icon={faClockRotateLeft} />
            </div>
        </div>
    </div>
</button>


<style>
    .tw-chat-settings-button {
        border-radius: var(--border-radius-medium);
        display: block;
        width: 100%;
        color: inherit;

        background: none;
        border: none;
        font: inherit;
    }

    .tw-chat-settings-button:hover,
    .tw-chat-settings-button:focus-visible {
        background-color: var(--color-background-interactable-hover);
    }

    .tw-chat-settings-button:active {
        background-color: var(--color-background-interactable-active);
    }

    .tw-chat-settings-button-content-container {
        display: flex !important;
        -webkit-box-align: center !important;
        align-items: center !important;
        position: relative !important;
        padding: 0.5rem !important;
    }

    .tw-chat-settings-button-text {
        -webkit-box-flex: 1 !important;
        flex-grow: 1 !important;
    }

    .tw-chat-settings-button-icon-wrapper {
        display: flex !important;
        -webkit-box-align: center !important;
        align-items: center !important;
        margin-left: 2rem !important;
        flex-shrink: 0 !important;
    }

    .tw-chat-settings-button-icon {
        display: inline-flex;
        -webkit-box-align: center;
        align-items: center;
        justify-content: center;
        height: 2rem;
        width: 2rem;

        position: relative;
        overflow: hidden;
    }
</style>