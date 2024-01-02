import { createNanoEvents, type Emitter, type Unsubscribe } from "nanoevents";
import liveChat from './index';
import { findOriginalElement } from "src/util/twitch";

const CHAT_LIST_SELECTOR = '.chat-list,.chat-list--default,.chat-list--other';


interface Events {
    'resize': () => void;
    'chat': (chatEl: Element) => void;
    'update:message-container': (messageContainer: ChatMessageContainer | null) => void;
}

interface ChatMessageContainer {
    element: HTMLElement;
    type: ChatMessageContainerType;
}

type ChatMessageContainerType = 'original' | '7tv';

export default class ChatList {
    private static instance: ChatList;
    private userCount: number = 0;
    private emitter: Emitter<Events>;

    private chatListEl: HTMLElement | null = null;

    private chatListResizeObserver: ResizeObserver;
    private chatListHeight: number = 0;

    private chatMessageContainer: ChatMessageContainer | null = null;
    private chatMessageContainerObserver: MutationObserver;

    private liveChatUnsubscribers: Unsubscribe[] = [];

    private constructor() {
        this.emitter = createNanoEvents<Events>();

        this.chatListResizeObserver = new ResizeObserver((entries) => {
            this.chatListHeight = entries[0].contentBoxSize[0].blockSize;
            this.emitter.emit('resize');
        });

        this.chatMessageContainerObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    this.emitter.emit('chat', node);
                });
            });
        });
    }

    static getInstance(): ChatList {
        if (!ChatList.instance) {
            ChatList.instance = new ChatList();
        }
        return ChatList.instance;
    }

    use() {
        if (this.userCount === 0) {
            this.init();
        }
        ++this.userCount;
    }

    release() {
        --this.userCount;
        if (this.userCount === 0) {
            this.destroy();
        }
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private init() {
        this.liveChatUnsubscribers.push(
            liveChat.on('update', () => this.observeChatMessageContainer())
        );

        liveChat.isEnabled && this.observeChatMessageContainer();
    }

    get height() {
        return this.chatListHeight;
    }

    get messageContainer() {
        return this.chatMessageContainer;
    }

    setChatListPaddingTop(pixels: number) {
        if (this.chatListEl) {
            this.chatListEl.style.paddingTop = `${pixels}px`;
        }
    }

    findChatMessageContainerRoot(): HTMLElement | null {
        const messageContainer = this.chatMessageContainer;
        if (!this.chatListEl || !messageContainer) return null;
        const chatMessageSourceRootEl = [...this.chatListEl.children].find(child => child.contains(messageContainer.element));
        return chatMessageSourceRootEl ? chatMessageSourceRootEl as HTMLElement : null;
    }

    private updateChatListEl() {
        if (document.contains(this.chatListEl)) return;
        this.chatListEl = document.querySelector(CHAT_LIST_SELECTOR);

        if (!this.chatListEl) return;

        this.chatListResizeObserver.disconnect();
        this.chatListResizeObserver.observe(this.chatListEl);
        this.chatListHeight = this.chatListEl.clientHeight - (parseFloat(this.chatListEl.style.paddingTop) || 0);
    }

    private tryGetChatMessageContainer(getters: {getElement: () => HTMLElement | null | undefined, type: ChatMessageContainerType}[]): ChatMessageContainer | null {
        for (const { getElement, type } of getters) {
            let element: HTMLElement | null | undefined;
            try {
                element = getElement();
            } catch {}
            if (element) {
                return { element, type };
            }
        }
        return null;
    }

    private updateChatMessageContainerEl() {
        this.updateChatListEl();
        if (document.contains(this.chatMessageContainer?.element || null) || !this.chatListEl) return;

        this.chatMessageContainer = this.tryGetChatMessageContainer([
            {
                getElement: () => findOriginalElement(this.chatListEl?.querySelectorAll<HTMLElement>('.chat-scrollable-area__message-container')),
                type: 'original'
            },
            {
                getElement: () => this.chatListEl?.querySelector<HTMLElement>('.seventv-chat-list'),
                type: '7tv'
            },
        ]);
        this.emitter.emit('update:message-container', this.chatMessageContainer);
    } 

    private observeChatMessageContainer() {
        if (document.contains(this.chatMessageContainer?.element || null)) return;

        this.chatMessageContainerObserver.disconnect();

        this.updateChatMessageContainerEl();
        if (this.chatMessageContainer?.type !== 'original') return;

        this.chatMessageContainerObserver.observe(this.chatMessageContainer.element, { childList: true });
    }

    private destroy() {
        this.setChatListPaddingTop(0);
        this.chatListEl = null;
        this.chatMessageContainer = null;

        this.chatListResizeObserver.disconnect();
        this.chatListHeight = 0;
        this.chatMessageContainerObserver.disconnect();
    }
}