<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getFilteredChatView } from '../FilteredChatView';
    import FilteredChatShareCard from './FilteredChatShareCard.svelte';
    import type { Unsubscribe } from 'nanoevents';
    import { joinedChatChannelStore } from '../../stores';

    const unsubscribers: Unsubscribe[] = [];

    let isDestroyed = false;
    
    let isCardOpen = false;

    const handleClickShare = () => {
        isCardOpen = !isCardOpen;
    };

    getFilteredChatView().then(filteredChatView => {
        if (isDestroyed) return;
        unsubscribers.push(
            filteredChatView.on('click:share', handleClickShare),
            joinedChatChannelStore.subscribe(() => isCardOpen = false),
        );
    });

    onDestroy(() => {
        isDestroyed = true;
        unsubscribers.forEach(unbind => unbind());
    });
</script>

<div class="relative h-full w-full z-10">
    {#if isCardOpen}
        <FilteredChatShareCard on:click:close={() => isCardOpen = false}/>
    {/if}
</div>