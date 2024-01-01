<script lang="ts" context="module">
    export type IconButtonType = 'normal' | 'primary' | 'ghost';
</script>

<script lang="ts">
    const buttonTypeClassnames: Record<IconButtonType, string> = {
        'normal': '',
        'primary': 'daisy-btn-primary',
        'ghost': 'daisy-btn-ghost',
    };

    export let disabled: boolean = false;
    export let type: IconButtonType = 'normal';
    export let isSquare: boolean = false;
</script>

<button
    class="daisy-btn no-animation flex-nowrap whitespace-nowrap {buttonTypeClassnames[type]} {isSquare ? 'daisy-btn-square' : ''}"
    {disabled}
    on:click
>
    <slot />
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