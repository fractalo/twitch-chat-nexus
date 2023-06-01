import routes from "../routes";
import domObserver from "../observers/domObserver";
import { createNanoEvents, type Emitter } from "nanoevents";


interface Events {
    update: () => void;
    destroy: (isPermanent: boolean) => void;
}

class LiveChat {
    private readonly validRouteNames = ['channel', 'channel-home', 'chat', 'embed-chat'];
    private emitter: Emitter;
    
    private removeDOMListener: ReturnType<typeof domObserver.on> | null = null;
    private domListenerTimer: number | undefined;

    private streamChatEl: HTMLElement | null = null; // assumed as static element
    private chatRoomContentEl: HTMLElement | null = null;
    
    private streamChatChildObserver: MutationObserver;
    private chatRoomContentChildObserver: MutationObserver;

    private _isEnabled = false;

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
                this.cleanup(false);
                this.startListeningDOMUpdates();
                this._isEnabled = true;
            } else {
                this.cleanup(true);
            }
        };

        routes.on('change', init);

        init(routes.name);
    }

    get isEnabled() {
        return this._isEnabled;
    }

    private disconnectObservers() {
        this.streamChatChildObserver.disconnect();
        this.chatRoomContentChildObserver.disconnect();
    }

    private cleanup(isPermanent: boolean) {
        if (!this._isEnabled) return;

        this.stopListeningDOMUpdates();
        this.disconnectObservers();
        this.streamChatEl = null;
        this.chatRoomContentEl = null;
        this._isEnabled = false;

        this.emitter.emit('destroy', isPermanent);
    }

    on<E extends keyof Events>(event: E, callback: Events[E]) {
        return this.emitter.on(event, callback);
    }

    private startListeningDOMUpdates() {
        if (!this.removeDOMListener) {
            this.removeDOMListener = domObserver.on('update', () => this.handleDOMUpdate());
        }
        
        clearTimeout(this.domListenerTimer);
        this.domListenerTimer = window.setTimeout(() => this.stopListeningDOMUpdates(), 60_000);

        this.handleDOMUpdate();
    }

    private stopListeningDOMUpdates() {
        this.removeDOMListener?.();
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
