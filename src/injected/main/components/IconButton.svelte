<script lang="ts" context="module">
    export type TextPosition = 'left' | 'right';
</script>

<script lang="ts">
    import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
    import Fa from 'svelte-fa';
    import type { IconButtonType } from "./Button.svelte";
    import Button from "./Button.svelte";

    export let icon: IconDefinition | null = null;
    export let text: string = '';
    export let textPosition: TextPosition = 'left';
    export let disabled: boolean = false;
    export let type: IconButtonType | undefined = undefined;

</script>

<Button
    isSquare={!text}
    {disabled}
    {type}
    on:click
>
    {#if text && textPosition === 'left'}
        <span class="mr-1">{text}</span>
    {/if}

    {#if icon}
        <Fa class="text-[1.6rem]" icon={icon} />
    {/if}

    {#if text && textPosition === 'right'}
        <span class="ml-1">{text}</span>
    {/if}
</Button>
