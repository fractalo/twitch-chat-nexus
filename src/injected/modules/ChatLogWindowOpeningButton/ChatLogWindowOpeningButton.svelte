<script lang="ts">
  import ChatInputButton from "./buttons/ChatInputButton.svelte";
  import ChatSettingsMenuButton from "./buttons/ChatSettingsMenuButton.svelte";

    let location = '';
    
    export let handleButtonClick: () => void;

    export const updateLocation = (newLocation: string) => location = newLocation;

</script>

{#if location === 'bottomOfChatWindow'}
    <ChatInputButton handleButtonClick={handleButtonClick} />
{:else if location === 'chatSettingsMenu'}
    <ChatSettingsMenuButton handleButtonClick={handleButtonClick} />
{/if}
