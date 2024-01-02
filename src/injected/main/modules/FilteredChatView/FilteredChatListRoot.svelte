<script lang="ts">
    import { onDestroy, type ComponentType, SvelteComponent } from 'svelte';
    import ChatList from "../../elements/LiveChat/ChatList";
    import type { Unsubscribe } from "nanoevents";
    import ClonedFilteredChatList from "./filteredChatLists/ClonedFilteredChatList.svelte";
    import GeneratedFilteredChatList from "./filteredChatLists/GeneratedFilteredChatList.svelte";
    import { joinedChatChannelStore } from '../../stores';

    const chatList = ChatList.getInstance();
    chatList.use();

    const unsubscribers: Unsubscribe[] = [];

    let filteredChatList: ComponentType<SvelteComponent> | null = null;
    let clear: (() => void) | null = null;
    let _scrollDown: (() => void) | null = null;

    export const scrollDown = () => _scrollDown?.();

    
    let chatMessageContainer = chatList.messageContainer;

    unsubscribers.push(
        chatList.on('update:message-container', container => chatMessageContainer = container),
        joinedChatChannelStore.subscribe(() => clear?.()),
    );

    $: {
        if (chatMessageContainer?.type === 'original') {
            filteredChatList = ClonedFilteredChatList;
        } else if (chatMessageContainer) {
            filteredChatList = GeneratedFilteredChatList;
        } else {
            filteredChatList = null;
            clear = null;
        }
    }

    onDestroy(() => {
        chatList.release();
        unsubscribers.forEach(unbind => unbind());
    });

</script>


<div class="tcn-chat-scrollable-container">
    <svelte:component this={filteredChatList} 
        on:update 
        on:scroll 
        bind:clear
        bind:scrollDown={_scrollDown}
    />
</div>


<style>
    .tcn-chat-scrollable-container {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        -webkit-box-flex: 1;
        flex-grow: 1;
        height: 100%;
    }
</style>