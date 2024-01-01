<script lang="ts">
    import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
    import IconButton from "./IconButton.svelte";

    export let icon: IconDefinition;
    export let disabled: boolean = false;

</script>

<div class="tcn-chat-icon-btn-wrap">
    <IconButton type="ghost" {icon} {disabled} on:click/>
</div>


<style>
    .tcn-chat-icon-btn-wrap {
        background-color: var(--color-background-base);
        border-radius: 0.4rem;
        box-shadow: var(--shadow-elevation-1);
    }
</style>