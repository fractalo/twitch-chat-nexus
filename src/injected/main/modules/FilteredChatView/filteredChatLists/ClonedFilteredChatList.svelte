<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { configStore, filteredChatMessages } from "../stores";
    import ChatList from "../../../elements/LiveChat/ChatList";
    import type { Unsubscribe } from "nanoevents";
    import type { SimpleBarRootElement } from './types';
    import { waitForSelector } from 'src/util/waitForSelector';
    import { findChatMessageData, findChatMessageInternal } from 'src/util/twitch';
    import type { ChatMessage, Config } from '../types';
    import type { ChatMessageInternal } from 'src/util/twitch/types';
    import { filterChat } from '../filterChat';
    import { toRecordSafe, toStringSafe, toTimestampSafe } from 'src/util/converters';
    import { isRecord } from 'src/util/typePredicates';
    import { isAlphaNumericUnderscore } from 'src/util/isAlphaNumericUnderscore';
    import { joinedChatChannelStore } from 'src/injected/main/stores';
    import ChatListFooter from '../ChatListFooter.svelte';
    import { openViewerCard } from 'src/injected/main/tools/chat';
    import dayjs from 'dayjs';

    const dispatch = createEventDispatcher();

    let simplebarRootEl: SimpleBarRootElement;
    let scrollContentEl: HTMLElement | null = null;

    let messageContainerEl: HTMLElement | undefined;

    const unsubscribers: Unsubscribe[] = [];

    const chatList = ChatList.getInstance();
    chatList.use();

    const chatMessageIds: Set<string> = new Set();
    const chatMessageByNonce: Map<string, ChatMessage> = new Map();

    let autoscroll: boolean = true;

    let newChatCount: number = 0;

    $: if (autoscroll) {
        newChatCount = 0;
    }

    const isScrolledToBottom = (): boolean => {
        if (!scrollContentEl) return false;
        const scrollableDistance = scrollContentEl.scrollHeight - scrollContentEl.offsetHeight;
        return scrollContentEl.scrollTop > scrollableDistance - 80;
    };

    const updateAutoscroll = () => {
        autoscroll = isScrolledToBottom();
    };

    const createChatMessage = (chatEl: Element, messageInternal: ChatMessageInternal | null, { id, nonce }: Partial<ChatMessage>): ChatMessage => {
        const message = messageInternal?.message;

        let userLogin = findChatMessageData(message, (message) => {
                    if (!isRecord(message.user)) return;
                    return toStringSafe(message.user.userLogin) || toStringSafe(message.user.username);
                }) || 
                chatEl.getAttribute('data-a-user') || 
                chatEl.getAttribute('data-user') || 
                chatEl.querySelector('.chat-author__intl-login')?.textContent || 
                undefined;
        
        const userDisplayName = findChatMessageData(message, (message) => {
                    if (!isRecord(message.user)) return;
                    return toStringSafe(message.user.userDisplayName) || toStringSafe(message.user.displayName);
                }) || 
                chatEl.querySelector('.chat-author__display-name')?.textContent || 
                undefined;

        if (!userLogin && isAlphaNumericUnderscore(userDisplayName)) {
            userLogin = userDisplayName?.toLowerCase();
        }

        const userColor = findChatMessageData(message, (message) => {
                    if (!isRecord(message.user)) return;
                    return toStringSafe(message.user.color);
                });

        const messageBody = findChatMessageData(message, message => toStringSafe(message.messageBody)) || 
                chatEl.querySelector('[data-a-target="chat-line-message-body"], .message')?.textContent ||
                undefined;

        return {
            id: id || window.crypto?.randomUUID(),
            nonce,
            timestamp: findChatMessageData(message, message => toTimestampSafe(message.timestamp)) || Date.now(),
            channelLogin: findChatMessageData(message, message => toStringSafe(message.channelLogin)) || $joinedChatChannelStore || undefined,
            userLogin,
            userDisplayName: userDisplayName?.toLowerCase(),
            userColor,
            badges: findChatMessageData(message, message => toRecordSafe(message.badges)),
            badgeDynamicData: findChatMessageData(message, message => toRecordSafe(message.badgeDynamicData)),
            messageBody: messageBody?.toLowerCase(),
        };
    };

    const appendChatMessage = (chatMessage: ChatMessage, chatEl: Element) => {
        removeExcessChatMessages();
        messageContainerEl?.append(chatEl);
        chatMessage.id && chatMessageIds.add(chatMessage.id);
        chatMessage.nonce && chatMessageByNonce.set(chatMessage.nonce, chatMessage);
        $filteredChatMessages.push({ message: chatMessage, element: chatEl });
        $filteredChatMessages = $filteredChatMessages;
    };

    const removeExcessChatMessages = () => {
        if (!$configStore) return;
        while ($filteredChatMessages.length >= $configStore.maxChatMessages) {
            const renderedChat = $filteredChatMessages.shift();
            $filteredChatMessages = $filteredChatMessages;
            renderedChat?.element?.remove();
            renderedChat?.message?.id && chatMessageIds.delete(renderedChat.message.id);
            renderedChat?.message?.nonce && chatMessageByNonce.delete(renderedChat.message.nonce);
        }
    };

    const isIdDuplicatedChatMessage = (id?: string): boolean => {
        return Boolean(id && chatMessageIds.has(id));
    };

    const isNonceDuplicatedChatMessage = (nonce?: string): boolean => {
        return Boolean(nonce && chatMessageByNonce.has(nonce));
    };

    // own chat is given an id when transmission is successful.
    const updateDuplicatedChatMessageId = (id?: string, nonce?: string): void => {
        if (!id || !nonce) return;
        const chatMessage = chatMessageByNonce.get(nonce);
        if (chatMessage) {
            chatMessageIds.delete(chatMessage.id);
            chatMessageIds.add(chatMessage.id = id);
        }
    };

    const addEventListeners = (chatEl: Element, chatMessage: ChatMessage, messageInternal: ChatMessageInternal | null) => {
        const fiber = messageInternal?.fiber;

        const usernameEl = chatEl.querySelector('.chat-line__username');

        const replyButtonEl = chatEl.querySelector('.chat-line__reply-icon button, .ffz-tooltip[data-action="reply"]');

        const pinButtonEl = chatEl.querySelector('.chat-line__pin-icon button, .ffz-tooltip[data-action="pin"]');

        usernameEl?.addEventListener('click', (event) => {
            openViewerCard(event, chatMessage.userLogin, chatMessage.id, fiber?.pendingProps?.onUsernameClick);
        });

        replyButtonEl?.addEventListener('click', () => {
            if (typeof fiber?.stateNode?.onMessageClick === 'function') {
                fiber.stateNode.onMessageClick();
            }
        });

        pinButtonEl?.addEventListener('click', () => {
            if (typeof fiber?.stateNode?.onPinMessageClick === 'function') {
                fiber.stateNode.onPinMessageClick();
            }
        });
    };

    const updateTimestamp = (chatEl: Element, chatMessage: ChatMessage) => {
        let timestampEl = chatEl.querySelector('.chat-line__timestamp');
        if ($configStore?.timestampFormat === 'hidden') {
            return timestampEl?.remove();
        }
        if (!chatMessage.timestamp) return;

        if (!timestampEl) {
            timestampEl = document.createElement('span');
            timestampEl.className = 'chat-line__timestamp';
        }

        timestampEl.textContent = dayjs(chatMessage.timestamp).format(
            $configStore?.timestampFormat === '24h' ? 'H:mm' : 'h:mm'
        );

        if (!chatEl.contains(timestampEl)) {
            chatEl.querySelector('.chat-line__username-container, .chat-line__username')
                    ?.parentElement?.prepend(timestampEl);
        }
    };
    
    const handleNewChat = (chatEl: Element) => {
        const chatMessageInternal = findChatMessageInternal(chatEl);

        const id = findChatMessageData(chatMessageInternal?.message, message => toStringSafe(message.id));
        const nonce = findChatMessageData(chatMessageInternal?.message, message => toStringSafe(message.nonce));

        if (isIdDuplicatedChatMessage(id)) return;

        if (isNonceDuplicatedChatMessage(nonce)) {
            return updateDuplicatedChatMessageId(id, nonce);
        }

        const chatMessage = createChatMessage(chatEl, chatMessageInternal, { id, nonce });

        if (!filterChat(chatMessage)) {
            return;
        }

        const clonedChatEl = chatEl.cloneNode(true) as Element;
        addEventListeners(clonedChatEl, chatMessage, chatMessageInternal);
        updateTimestamp(clonedChatEl, chatMessage);

        updateAutoscroll();
        appendChatMessage(chatMessage, clonedChatEl);

        if (autoscroll) {
            scrollDown();
        } else {
            ++newChatCount;
        }
        
        dispatch('update');
    };

    let prevConfig: Config | null = null;

    unsubscribers.push(
        chatList.on('chat', handleNewChat),
        configStore.subscribe((config) => {
            if (prevConfig?.timestampFormat !== config?.timestampFormat) {
                $filteredChatMessages.forEach(chatMessage => {
                    updateTimestamp(chatMessage.element, chatMessage.message);
                });
            }
            prevConfig = config;
        }),
    );

    export const clear = () => {
        chatMessageIds.clear();
        chatMessageByNonce.clear();
        $filteredChatMessages = [];
        messageContainerEl?.replaceChildren();
    };

    export const scrollDown = () => {
        scrollContentEl?.scrollTo(0, scrollContentEl.scrollHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
        autoscroll && scrollDown();
    });

    const abortController = new AbortController();
    const handleScroll = () => {
        updateAutoscroll();
        dispatch('scroll');
    };

    let isDestroyed = false;

    onMount(() => {
        resizeObserver.observe(simplebarRootEl);
        waitForSelector(
            ".simplebar-scroll-content", 
            simplebarRootEl, 
            abortController.signal
        )
        .then(element => {
            if (isDestroyed) return;
            scrollContentEl = element;
            scrollContentEl.addEventListener('scroll', handleScroll);
        })
        .catch(() => console.error('cannot find scrollContent of filtered chat list!'));
    });

    onDestroy(() => {
        isDestroyed = true;
        resizeObserver.disconnect();
        chatList.release();
        unsubscribers.forEach(unbind => unbind());
        abortController.abort();
        scrollContentEl?.removeEventListener('scroll', handleScroll);
        $filteredChatMessages = [];
    });

</script>


<div class="scrollable-area" data-simplebar
    bind:this={simplebarRootEl}
>
    <div class="tcn-chat-message-container-cloned" bind:this={messageContainerEl} ></div>
</div>

{#if !autoscroll}
    <ChatListFooter on:click={scrollDown} {newChatCount} />
{/if}

<style>
    .tcn-chat-message-container-cloned {
        padding-bottom: 1rem;
        -webkit-box-flex: 1 !important;
    }
</style>