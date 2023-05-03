<script lang="ts">
    import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
    import Fa from 'svelte-fa/src/fa.svelte';

    type TextPosition = 'left' | 'right';
    type IconButtonType = 'normal' | 'primary' | 'ghost';

    const buttonTypeClassnames: Record<IconButtonType, string> = {
        'normal': '',
        'primary': 'daisy-btn-primary',
        'ghost': 'daisy-btn-ghost'
    }

    export let icon: IconDefinition;
    export let text: string = '';
    export let textPosition: TextPosition = 'left';
    export let disabled: boolean = false;
    export let handleClick: (() => void) | null = null;
    export let type: IconButtonType = 'normal';

</script>

<button
    class="daisy-btn no-animation normal-case flex-nowrap whitespace-nowrap {buttonTypeClassnames[type]} {!text ? 'daisy-btn-square' : ''}"
    disabled={disabled}
    on:click={handleClick}
>
    {#if text && textPosition === 'left'}
        <span class="mr-1">{text}</span>
    {/if}

    <Fa class="text-[1.65rem]" icon={icon} />

    {#if text && textPosition === 'right'}
        <span class="ml-1">{text}</span>
    {/if}
</button>

<style>
    .daisy-btn {
        border-width: 0px;
        border-radius: var(--border-radius-medium);
        font-size: var(--button-text-default);
        font-family: inherit;

        background-color: var(--color-background-button-secondary-default);
        color: var(--color-text-button-secondary);

    }

    .daisy-btn:hover,
    .daisy-btn:focus-visible {
        background-color: var(--color-background-button-secondary-hover);
    }

    .daisy-btn:active {
        background-color: var(--color-background-button-secondary-active);
    }

    .daisy-btn-primary {
        background-color: var(--color-background-button-primary-default);
        color: var(--color-text-button-primary);
    }

    .daisy-btn-primary:hover,
    .daisy-btn-primary:focus-visible {
        background-color: var(--color-background-button-primary-hover);
    }

    .daisy-btn-primary:active {
        background-color: var(--color-background-button-primary-active);
    }

    .daisy-btn-ghost {
        background-color: var(--color-background-button-text-default);
        color: var(--color-fill-button-icon);
    }

    .daisy-btn-ghost:hover,
    .daisy-btn-ghost:focus-visible {
        background-color: var(--color-background-button-text-hover);
    }

    .daisy-btn-ghost:active {
        background-color: var(--color-background-button-text-active);
    }

    .daisy-btn[disabled], 
    .daisy-btn[disabled]:hover {
        background-color: var(--color-background-button-disabled);
        color: var(--color-text-button-disabled);
    }
</style>