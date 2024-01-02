import { createNanoEvents, type Emitter, type Unsubscribe } from "nanoevents";
import liveChat from './index';


interface Events {
    update: () => void;
}

export default class ChatRoomContent {
    private static instance: ChatRoomContent;
    private userCount: number = 0;
    private readonly emitter: Emitter<Events>;

    private chatRoomContentRootEl: Element | null = null;

    private unsubscribers: Unsubscribe[] = [];

    private constructor() {
        this.emitter = createNanoEvents();
    }

    static getInstance(): ChatRoomContent {
        if (!ChatRoomContent.instance) {
            ChatRoomContent.instance = new ChatRoomContent();
        }
        return ChatRoomContent.instance;
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

    get rootEl() {
        return this.chatRoomContentRootEl;
    }

    private init() {
        this.unsubscribers.push(
            liveChat.on('update', () => this.updateChatRoomContentRoot())
        );
        liveChat.isEnabled && this.updateChatRoomContentRoot();
    }

    private updateChatRoomContentRoot() {
        if (document.contains(this.chatRoomContentRootEl)) return;

        this.chatRoomContentRootEl = document.querySelector('.chat-room__content');
    }

    private destroy() {
        this.chatRoomContentRootEl = null;

        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];
    }
}
