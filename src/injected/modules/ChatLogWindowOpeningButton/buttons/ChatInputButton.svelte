<script lang="ts">
    import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
    import { i18nMessageStore }  from '../store';
    import Tooltip from 'src/injected/components/Tooltip.svelte';
    import IconButton from 'src/injected/components/IconButton.svelte';

    export let handleButtonClick: () => void;

    let i18nMessages: Record<string, string> | null;

    i18nMessageStore.subscribe(messages => {
        i18nMessages = messages;
    });

</script>

{#if i18nMessages}
<Tooltip label={i18nMessages.openingButtonLabel}>
    <IconButton type="ghost" icon={faClockRotateLeft} handleClick={handleButtonClick}/>
</Tooltip>
{/if}


