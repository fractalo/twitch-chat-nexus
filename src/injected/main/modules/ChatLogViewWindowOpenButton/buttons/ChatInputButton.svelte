<script lang="ts">
    import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
    import Tooltip from 'src/injected/main/components/Tooltip.svelte';
    import IconButton from 'src/injected/main/components/IconButton.svelte';
    import { i18n } from 'src/i18n';

    export let handleButtonClick: () => void;

</script>


<Tooltip text={$i18n.t('chatLogViewOpeningButton.tooltip', { ns: 'mainApp' })}>
    <IconButton type="ghost" icon={faClockRotateLeft} on:click={handleButtonClick}/>
</Tooltip>


