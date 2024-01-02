import type { Unsubscribe } from "nanoevents";
import liveChat from "../../elements/LiveChat";
import { configStore } from "../FilteredChatView/stores";
import ChatRoomContent from "../../elements/LiveChat/ChatRoomContent";
import FilteredChatShareCardLayer from "./FilteredChatShareCardLayer.svelte";
import { setDaisyUiTheme } from "src/util/twitch";

class FilteredChatShareView {
    private isInitialized: boolean = false;

    private readonly chatRoomContent = ChatRoomContent.getInstance();

    private rootEl: HTMLElement;
    
    private filteredChatShareCardLayer: FilteredChatShareCardLayer | null = null;

    private unsubscribers: Unsubscribe[] = [];

    constructor() {
        this.rootEl = document.createElement('div');
        setDaisyUiTheme(this.rootEl);
        this.rootEl.classList.add('tcn-filtered-chat-share');
        this.rootEl.classList.add('absolute', 'h-full', 'w-full', 'pointer-events-none');

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

        this.chatRoomContent.use();

        this.filteredChatShareCardLayer = new FilteredChatShareCardLayer({ target: this.rootEl });

        this.unsubscribers.push(
            liveChat.on('update', () => this.insertRoot()),
        );

        liveChat.isEnabled && this.insertRoot();
    }

    private insertRoot() {
        if (document.contains(this.rootEl)) return;

        if (!this.chatRoomContent.rootEl) return;

        this.chatRoomContent.rootEl.append(this.rootEl);
    }

    private destroy() {
        if (!this.isInitialized) return;
        this.isInitialized = false;

        this.chatRoomContent.release();

        this.filteredChatShareCardLayer?.$destroy();

        this.rootEl.remove();

        this.unsubscribers.forEach(unbind => unbind());
        this.unsubscribers = [];
    }
}

export default new FilteredChatShareView();