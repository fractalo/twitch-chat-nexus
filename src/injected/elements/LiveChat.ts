import routes from "../routes";
import domObserver from "../observers/domObserver";
import { createNanoEvents, type Emitter } from "nanoevents";


interface Events {
    update: () => void;
}

class LiveChat {
    private readonly validRouteNames = ['channel', 'chat', 'embed-chat'];
    private emitter: Emitter;
    
    private removeDOMListener: ReturnType<typeof domObserver.on> | null = null;
    private domListenerTimer: number | undefined;

    private streamChatEl: HTMLElement | null = null; // static element
    private chatRoomContentEl: HTMLElement | null = null;
    
    private streamChatChildObserver: MutationObserver;
    private chatRoomContentChildObserver: MutationObserver;

    constructor() {
        this.emitter = createNanoEvents<Events>();

        this.streamChatChildObserver = new MutationObserver(() => {
            this.startListeningDOMUpdates();
        });

        this.chatRoomContentChildObserver = new MutationObserver(() => {
            this.startListeningDOMUpdates();
        });

        const init = (routeName: string) => {
            if (this.validRouteNames.includes(routeName)) {
                // setup
                this.startListeningDOMUpdates();
            } else {
                // cleanup
                this.stopListeningDOMUpdates();
                this.disconnectObservers();
                this.streamChatEl = null;
                this.chatRoomContentEl = null;
            }
        };

        routes.on('change', init);

        init(routes.name);

    }

    private disconnectObservers() {
        this.streamChatChildObserver.disconnect();
        this.chatRoomContentChildObserver.disconnect();
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private startListeningDOMUpdates() {
        if (this.removeDOMListener) {
            return;
        }
        this.removeDOMListener = domObserver.on('update', () => this.handleDOMUpdate());
        clearTimeout(this.domListenerTimer);
        this.domListenerTimer = window.setTimeout(() => this.stopListeningDOMUpdates(), 60_000);

        this.handleDOMUpdate();
    }

    private stopListeningDOMUpdates() {
        if (!this.removeDOMListener) {
            return;
        }
        this.removeDOMListener();
        this.removeDOMListener = null;
    }

    private handleDOMUpdate() {
        if (!document.contains(this.streamChatEl)) {
            this.streamChatEl = document.querySelector('.stream-chat');
            this.streamChatEl && this.streamChatChildObserver.observe(this.streamChatEl, { childList: true });
        }
    
        if (!document.contains(this.chatRoomContentEl)) {
            this.chatRoomContentEl = document.querySelector('.chat-room__content');
            this.chatRoomContentEl && this.chatRoomContentChildObserver.observe(this.chatRoomContentEl, { childList: true });
        }

        this.emitter.emit('update');
    }
}


export default new LiveChat();
