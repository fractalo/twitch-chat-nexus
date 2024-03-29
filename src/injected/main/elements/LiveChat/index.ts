import routes from "../../routes";
import domObserver from "../../observers/domObserver";
import { createNanoEvents, type Emitter } from "nanoevents";


interface Events {
    update: () => void;
    'update:rootEl': (el: HTMLElement) => void;
    destroy: (isPermanent: boolean) => void;
}

class LiveChat {
    private readonly validRouteNames = ['channel', 'channel-home', 'chat', 'embed-chat'];
    private emitter: Emitter<Events>;
    
    private removeDOMListener: ReturnType<typeof domObserver.on> | null = null;
    private domListenerTimer: number | undefined;

    private streamChatEl: HTMLElement | null = null; // assumed as static element
    private chatRoomContentEl: HTMLElement | null = null;
    
    private streamChatObserver: MutationObserver;
    private chatRoomContentObserver: MutationObserver;

    private _isEnabled = false;

    constructor() {
        this.emitter = createNanoEvents<Events>();

        this.streamChatObserver = new MutationObserver(() => {
            this.startListeningDOMUpdates();
        });

        this.chatRoomContentObserver = new MutationObserver(() => {
            this.startListeningDOMUpdates();
        });

        routes.on('change', routeName => this.init(routeName));

        this.init(routes.name);
    }

    private init(routeName: string) {
        if (this.validRouteNames.includes(routeName)) {
            this.cleanup(false);
            this.startListeningDOMUpdates();
            this._isEnabled = true;
        } else {
            this.cleanup(true);
        }
    }

    get isEnabled() {
        return this._isEnabled;
    }

    get rootEl() {
        return this.streamChatEl;
    }

    private disconnectObservers() {
        this.streamChatObserver.disconnect();
        this.chatRoomContentObserver.disconnect();
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
            if (this.streamChatEl) {        
                this.streamChatObserver.disconnect();
                this.streamChatObserver.observe(this.streamChatEl, { childList: true });
                this.emitter.emit('update:rootEl', this.streamChatEl);
            }
        }
    
        if (!document.contains(this.chatRoomContentEl)) {
            this.chatRoomContentEl = document.querySelector('.chat-room__content');
            if (this.chatRoomContentEl) {
                this.chatRoomContentObserver.disconnect();
                this.chatRoomContentObserver.observe(this.chatRoomContentEl, { childList: true });
            }
        }

        this.emitter.emit('update');
    }
}


export default new LiveChat();
