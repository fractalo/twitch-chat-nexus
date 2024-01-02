import { createNanoEvents, type Emitter, type Unsubscribe } from "nanoevents";
import liveChat from './index';
import { findReactInstance, findReactSiblingInstance } from "src/util/twitch";
import ChatRoomContent from "./ChatRoomContent";

interface Events {
    'height-change': (height: number) => void;
}

export default class ChatListHeader {
    private static instance: ChatListHeader;
    private userCount: number = 0;
    private emitter: Emitter<Events>;

    private readonly chatRoomContent = ChatRoomContent.getInstance();

    private chatListHeaderRootEl: Element | null = null;
    private chatListHeaderEl: HTMLElement | null = null;

    private chatListHeaderRootObserver: MutationObserver;
    private chatListHeaderResizeObserver: ResizeObserver;

    private unsubscribers: Unsubscribe[] = [];

    private constructor() {
        this.emitter = createNanoEvents<Events>();

        this.chatListHeaderRootObserver = new MutationObserver(() => {
            this.observeChatListHeader();
        });
    
        this.chatListHeaderResizeObserver = new ResizeObserver((entries) => {
            const height = entries[0].borderBoxSize[0].blockSize;
            this.emitter.emit('height-change', height);
        });
    }

    static getInstance(): ChatListHeader {
        if (!ChatListHeader.instance) {
            ChatListHeader.instance = new ChatListHeader();
        }
        return ChatListHeader.instance;
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

    get height() {
         if (!this.chatListHeaderEl) return 0;
         return this.chatListHeaderEl.clientHeight;
    }

    private init() {
        this.chatRoomContent.use();
        this.unsubscribers.push(
            liveChat.on('update', () => this.observeChatListHeaderRoot())
        );
        liveChat.isEnabled && this.observeChatListHeaderRoot();
    }

    private observeChatListHeader() {
        if (document.contains(this.chatListHeaderEl)) {
            return;
        }

        this.chatListHeaderResizeObserver.disconnect();

        this.chatListHeaderEl = document.querySelector('div[class^="community-highlight-stack"]')?.parentElement || null;

        if (!this.chatListHeaderEl) {
            this.emitter.emit('height-change', 0);
            return;
        }

        this.chatListHeaderResizeObserver.observe(this.chatListHeaderEl);
        this.emitter.emit('height-change', this.chatListHeaderEl.clientHeight);
    }

    private observeChatListHeaderRoot() {
        if (document.contains(this.chatListHeaderRootEl)) return;

        this.chatListHeaderRootObserver.disconnect();

        if (!this.chatRoomContent.rootEl) return;

        const chatRoomContentEls = [...this.chatRoomContent.rootEl.children];

        this.chatListHeaderRootEl = chatRoomContentEls.find((element) => {
            return !!findReactSiblingInstance(
                findReactInstance(element), 
                (sibling) => {
                    return sibling.memoizedProps.hasOwnProperty('badgeSets') ||
                    sibling.memoizedProps.className === "chat-room__notifications";
                }
            );
        }) || null;

        if (!this.chatListHeaderRootEl) {
            this.chatListHeaderRootEl = chatRoomContentEls.find((element) => {
                return !element.attributes.length && element.children.length;
            }) || null;
        }

        if (!this.chatListHeaderRootEl) return;

        this.chatListHeaderRootObserver.observe(this.chatListHeaderRootEl, { childList: true, subtree: true });
        this.observeChatListHeader();
    }

    private destroy() {
        this.chatRoomContent.release();

        this.chatListHeaderRootEl = null;
        this.chatListHeaderEl = null;

        this.chatListHeaderRootObserver.disconnect();
        this.chatListHeaderResizeObserver.disconnect();

        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];
    }
}
