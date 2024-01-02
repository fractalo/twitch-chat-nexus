import type { Unsubscribe } from "nanoevents";
import ChatList from "../../elements/LiveChat/ChatList";
import ChatListHeader from "../../elements/LiveChat/ChatListHeader";
import { configStore } from "../FilteredChatView/stores";

class ChatListPaddingAdjuster {
    private isInitialized: boolean = false;

    private readonly chatList = ChatList.getInstance();
    private readonly chatListHeader = ChatListHeader.getInstance();

    private unsubscribers: Unsubscribe[] = [];

    constructor() {
        configStore.subscribe(config => {
            if (!config) return;
            if (!config.isEnabled) {
                return this.destroy();
            }
            this.init();
        });
    }

    private init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.chatList.use();
        this.chatListHeader.use();

        this.unsubscribers.push(
            this.chatListHeader.on('height-change', (height) => {
                this.chatList.setChatListPaddingTop(height);
            }),
        );
        this.chatList.setChatListPaddingTop(this.chatListHeader.height);
    }

    private destroy() {
        if (!this.isInitialized) return;
        this.isInitialized = false;

        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];

        this.chatList.release();
        this.chatListHeader.release();
    }
}

export default new ChatListPaddingAdjuster();